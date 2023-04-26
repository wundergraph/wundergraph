import { Straightforward, Request, Response, RequestContext } from '@wundergraph/straightforward';
import getRawBody from 'raw-body';
import debug from 'debug';
import { freeport } from './util';
import { IncomingHttpHeaders } from 'http';

const log = debug('wunderctl:mock-server');

export interface MockScope {
	isDone: boolean;
	error?: Error;
	done(): void;
}

export interface Interceptor {
	match: (req: MockRequest) => Promise<boolean>;
	handler: (req: MockRequest) => Promise<MockResponse>;
	scope: MockScope;
}

export interface MockResponse<Response = any> {
	status?: number;
	headers?: Record<string, string>;
	body?: Response;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface UrlParts {
	/**
	 * The hostname of the request. Extracted from the Host header.
	 */
	host: string;
	/**
	 * The port number as a string.
	 */
	port: number;
	/**
	 * The full path including query parameters.
	 */
	path: string;
}

export interface MockRequest {
	url: UrlParts;

	/**
	 * The HTTP method of the request.
	 */
	method?: HTTPMethod;

	/**
	 * The headers of the request.
	 */
	headers: IncomingHttpHeaders;

	/**
	 * Parse the request body as JSON.
	 */
	json<Body = any>(): Promise<Body>;

	/**
	 * Parse the request body as text.
	 */
	text(): Promise<string>;
}

export class WunderGraphMockServer {
	private proxy: Straightforward;
	private port: number;
	private interceptors: Array<Interceptor>;

	constructor() {
		this.proxy = new Straightforward();
		this.port = 0;
		this.interceptors = [];
	}

	/**
	 * Start the server on a random port.
	 */
	async start(): Promise<void> {
		this.port = await freeport();
		await this.proxy.listen(this.port);

		this.proxy.onRequest.use(async (ctx, next) => {
			let req: Request = ctx.req;

			await this.handleRequest(ctx);
		});
	}

	public pendingInterceptors(): Array<Interceptor> {
		return this.interceptors;
	}

	private async handleRequest(ctx: RequestContext) {
		let req: Request = ctx.req;
		let res = ctx.res;

		let scope: MockScope | undefined = undefined;
		let matched = false;

		for (let interceptor of this.interceptors) {
			scope = interceptor.scope;

			try {
				const mockReq: MockRequest = {
					headers: req.headers,
					url: req.locals.urlParts,
					method: req.method as HTTPMethod,
					json<Body = any>(): Promise<Body> {
						return getJSONBody(req);
					},
					text(): Promise<string> {
						return getTextBody(req);
					},
				};

				// Skip if the request does not match, try the next interceptor
				if ((await interceptor.match(mockReq)) === false) {
					log('request did not match interceptor: %s %s', req.method, req.url);
					continue;
				}

				matched = true;

				log('request matched with interceptor: %s %s', req.method, req.url);

				const mockRes = await interceptor.handler(mockReq);

				let headers: Record<string, string> = { ...(mockRes.headers || {}) };

				let body = '';
				if (mockRes.body) {
					if (typeof mockRes.body != 'string') {
						headers['Content-Type'] = 'application/json; charset=utf-8';
						body = JSON.stringify(mockRes.body);
					} else {
						headers['Content-Type'] = 'text/plain; charset=utf-8';
						body = mockRes.body;
					}

					headers['Content-Length'] = Buffer.byteLength(body).toString();
				}

				res.writeHead(mockRes.status || 200, headers);
				res.end(body);

				// Remove the interceptor from the list after it was called
				this.interceptors = this.interceptors.filter((ic) => ic !== interceptor);

				scope.isDone = true;

				// An interceptor can only be called once for now
				break;
			} catch (err: any) {
				log('error in mock handler, continue with the next interceptor, %s, %s error: %s', req.method, req.url, err);

				if (scope) {
					scope.error = err;
					scope.isDone = false;
				}
			}
		}

		if (matched === false) {
			log('no mock handler matched, continue with the next handler, %s, %s', req.method, req.url);
			if (scope) {
				scope.error = new Error(`no interceptor matched for request ${req.method} ${req.url}`);
			}
		}
	}

	/**
	 * Stop the server.
	 */
	async stop(): Promise<void> {
		this.interceptors = [];
		this.port = 0;

		process.nextTick(() => this.proxy.close());
		return new Promise((resolve) => {
			this.proxy.once('close', resolve);
		});
	}

	/**
	 * The URL of the mock server.
	 */
	public url(): string {
		return `http://0.0.0.0:${this.port}`;
	}

	private createScope(): MockScope {
		return {
			/**
			 * Is true, if the mock matched and the handler was called.
			 */
			isDone: false,
			/**
			 * The error thrown by the matcher or handler.
			 */
			error: undefined,
			/**
			 * Throw an error if the scope is not done or an error was thrown.
			 */
			done() {
				if (this.error) {
					throw this.error;
				}
				if (!this.isDone) {
					throw new Error('Not done');
				}
			},
		};
	}

	/**
	 * When you setup an interceptor for a URL and that interceptor is used, it is removed from the interceptor list.
	 * This means that you can intercept 2 or more calls to the same URL and return different things on each of them.
	 * It also means that you must setup one interceptor for each request you are going to have
	 * otherwise it will throw an error because that URL was not present in the interceptor list.
	 */
	mock<Response = any>(
		/**
		 * The matcher function.
		 */
		match: (req: MockRequest) => Promise<boolean>,
		/**
		 * The handler function. Return the mocked response.
		 * If error is thrown the handler is skipped and the next handler is called.
		 * You can use test assertions in the handler to verify the request.
		 * If error is thrown the handler is skipped and the next handler is called.
		 */
		handler: (req: MockRequest) => Promise<MockResponse<Response>>
	) {
		const scope = this.createScope();

		this.interceptors.push({
			scope,
			match,
			handler,
		});

		return scope;
	}

	/**
	 * Assert that a https or wss requests occur. The handler is called when the request matches.
	 * Use this, if you want to test WG_HTTP_PROXY feature.
	 * You can use test assertions in the handler to verify the request.
	 * If error is thrown the handler is skipped and the next handler is called.
	 */
	assertHTTPConnect(match: (req: Request) => Promise<boolean>) {
		const scope = this.createScope();

		this.proxy.onConnect.use(async ({ req }, next) => {
			try {
				// If the request does not match or throws, pass to the next handler.
				if (!(await match(req))) {
					return next();
				}
				scope.isDone = true;
			} catch (err: any) {
				scope.error = err;
				return next();
			}
		});

		return scope;
	}
}

function getJSONBody<Body = any>(req: Request): Promise<Body> {
	return new Promise((resolve, reject) => {
		getRawBody(req, (err, body) => {
			if (err) {
				reject(err);
			} else {
				resolve(JSON.parse(body.toString()));
			}
		});
	});
}

function getTextBody(req: Request): Promise<string> {
	return new Promise((resolve, reject) => {
		getRawBody(req, (err, body) => {
			if (err) {
				reject(err);
			} else {
				resolve(body.toString());
			}
		});
	});
}
