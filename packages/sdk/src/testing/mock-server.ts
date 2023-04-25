import { Straightforward, Request, RequestAdditions } from '@wundergraph/straightforward';
import getRawBody from 'raw-body';
import debug from 'debug';
import { freeport } from './util';
import { IncomingHttpHeaders } from 'http';

const log = debug('wunderctl:mock-server');

export interface MockScope {
	isDone: boolean;
	error?: Error;
	reset(): void;
	done(): void;
}

export interface MockResponse<Response = any> {
	status?: number;
	headers?: Record<string, string>;
	body?: Response;
}

export interface MockRequest {
	url: {
		host: string;
		port: number;
		path: string;
	};
	method?: string;
	headers: IncomingHttpHeaders;
	json<Body = any>(): Promise<Body>;
	text(): Promise<string>;
}

export class WunderGraphMockServer {
	private proxy: Straightforward;
	private port: number;

	constructor() {
		this.proxy = new Straightforward();
		this.port = 0;
	}

	/**
	 * Start the server on a random port.
	 */
	async start(): Promise<void> {
		this.port = await freeport();
		await this.proxy.listen(this.port);
	}

	/**
	 * Stop the server.
	 */
	async stop(): Promise<void> {
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

	private createMockScope(): MockScope {
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
			/**
			 * Reset the scope.
			 */
			reset() {
				this.isDone = false;
				this.error = undefined;
			},
		};
	}

	/**
	 * Mock a request. The handler is called when the request matches.
	 * Use this, if you want to point your datasource to the mock server.
	 */
	mock<Response = any>(
		/**
		 * The matcher function. Throw an error if the request does not match.
		 * The thrown error will be used as the error when calling `done()`.
		 */
		match: (req: MockRequest) => Promise<void>,
		/**
		 * The handler function. Return the mocked response.
		 */
		handler: (req: MockRequest) => Promise<MockResponse<Response>>
	) {
		const scope = this.createMockScope();

		this.proxy.onRequest.use(async (ctx, next) => {
			let req: Request = ctx.req;
			let res = ctx.res;

			try {
				const mockReq: MockRequest = {
					headers: req.headers,
					url: req.locals.urlParts,
					method: req.method,
					json<Body = any>(): Promise<Body> {
						return getJSONBody(req);
					},
					text(): Promise<string> {
						return getTextBody(req);
					},
				};

				try {
					await match(mockReq);
				} catch (err: any) {
					log('error in mock match: %s, %s error: %s', req.method, req.url, err);

					scope.error = err;

					res.writeHead(500);
					res.end();
					return;
				}

				log('request matched: %s %s', req.method, req.url);

				const mockRes = await handler(mockReq);

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

				scope.isDone = true;
			} catch (err: any) {
				log('error in mock handler: %s, %s error: %s', req.method, req.url, err);

				scope.error = err;

				res.writeHead(500);
				res.end();
			}
		});

		return scope;
	}

	/**
	 * Assert that a request is made. The handler is called when the request matches.
	 * Use this, if you use he WG_HTTP_PROXY feature.
	 */
	assertConnect(match: (req: Request) => void) {
		this.proxy.onConnect.use(async ({ req }, next) => {
			match(req);
			return next();
		});
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
