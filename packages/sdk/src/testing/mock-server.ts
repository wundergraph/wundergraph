import { Straightforward, Request, RequestContext, ConnectContext, Next } from '@wundergraph/straightforward';
import getRawBody from 'raw-body';
import debug from 'debug';
import { freeport } from './util';
import { IncomingHttpHeaders } from 'http';
import { Scope } from './scope';

const log = debug('wunderctl:mock-server');

interface RequestMock<Response = any> {
	type: 'request';
	scope: Scope;
	/**
	 * The matcher function. Return true if the mock should be used.
	 * You can use test assertions in the handler to verify the request.
	 * If error is thrown the handler is skipped and the next handler is called.
	 */
	match: (req: Omit<MockRequest, '_body'>) => Promise<boolean> | boolean;
	/**
	 * The handler function. Return the mocked response.
	 * You can use test assertions in the handler to verify the request.
	 * If error is thrown the handler is skipped and the next handler is called.
	 */
	handler: (req: Omit<MockRequest, '_body'>) => Promise<MockResponse<Response>> | MockResponse<Response>;
}

interface ConnectMock {
	type: 'connect';
	scope: Scope;
	/**
	 * The matcher function. Return true if the request should be asserted.
	 */
	match: (req: Request) => Promise<boolean> | boolean;
}

type Mock = RequestMock | ConnectMock;

export interface MockResponse<Response = any> {
	status?: number;
	headers?: Record<string, string>;
	body?: Response;
}

export interface MockRequestOptions<Response = any> extends Omit<RequestMock<Response>, 'scope' | 'type'> {
	times?: number;
	persist?: boolean;
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

	/**
	 * The parsed request body.
	 */
	_body?: any;
}

export class WunderGraphMockServer {
	private proxy: Straightforward;
	private port: number;
	private mocks: Array<Mock>;

	constructor() {
		this.proxy = new Straightforward();
		this.port = 0;
		this.mocks = [];
	}

	/**
	 * Start the server on a random port.
	 */
	async start(): Promise<void> {
		this.port = await freeport();
		await this.proxy.listen(this.port);

		this.proxy.onRequest.use(
			async (ctx, next) => {
				await this.handleRequest(ctx, next);
			},
			async (ctx, next) => {
				ctx.res.writeHead(404);
				ctx.res.end();
			}
		);

		this.proxy.onConnect.use(async (ctx, next) => {
			await this.handleConnect(ctx);

			next();
		});
	}

	private async handleRequest(ctx: RequestContext, next: Next) {
		let req: Request = ctx.req;
		let res = ctx.res;

		let scope: Scope | undefined = undefined;
		let matched = false;

		for (let mock of this.mocks) {
			scope = mock.scope;

			if (mock.type !== 'request') {
				continue;
			}

			try {
				const mockReq: Omit<MockRequest, 'json' | 'text'> = {
					headers: req.headers,
					url: req.locals.urlParts,
					method: req.method as HTTPMethod,
				};

				const json = async <Body = any>(): Promise<Body> => {
					if (mockReq._body) {
						return mockReq._body;
					}
					mockReq._body = await getJSONBody(req);
					return mockReq._body;
				};
				const text = async (): Promise<string> => {
					if (mockReq._body) {
						return mockReq._body;
					}
					mockReq._body = await getTextBody(req);
					return mockReq._body;
				};

				const userMockReq: MockRequest = {
					...mockReq,
					json,
					text,
				};

				// Skip if the request does not match, try the next mock
				if (!(await mock.match(userMockReq))) {
					log('request did not match mock: %s %s', req.method, req.url);
					continue;
				}

				log('request matched with mock: %s %s', req.method, req.url);

				const mockRes = await mock.handler(userMockReq);

				matched = true;

				scope.pending++;

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

				if (scope.isPersisted) {
					break;
				}

				scope.counter--;

				if (scope.counter === 0) {
					// Remove the mock from the list after all requests have been handled
					this.mocks = this.mocks.filter((ic) => ic !== mock);
					break;
				}
			} catch (err: any) {
				log('error in mock handler, continue with the next mock, %s, %s error: %s', req.method, req.url, err);

				if (err instanceof Error) {
					const cause = new Error(`No mock matched for request ${req.method} ${req.url}`);
					// Add more context to the error message. Can be replaced by setting `cause`
					// when all popular test runners support it for printing the error message
					err.message = err.message + '\nCaused by: ' + cause.message;
					// @ts-expect-error - That allows modern test runners to print the cause
					err.cause = cause;
				}

				if (scope) {
					scope.error = err;
				}
			} finally {
				scope.pending--;
			}
		}

		if (matched === false) {
			log('no mock handler matched, continue with the next handler, %s, %s', req.method, req.url);

			if (scope && !scope.error) {
				scope.error = new Error(`No mock matched for request ${req.method} ${req.url}`);
			}

			await next();
		}
	}

	private async handleConnect(ctx: ConnectContext) {
		let req: Request = ctx.req;

		let scope: Scope | undefined = undefined;
		let matched = false;

		for (let mock of this.mocks) {
			scope = mock.scope;

			if (mock.type !== 'connect') {
				continue;
			}

			try {
				// If the request does not match or throws, pass to the next handler.
				if (!(await mock.match(req))) {
					log('connect request did not match mock: %s %s', req.method, req.url);
					continue;
				}

				matched = true;

				log('connect request matched with mock: %s %s', req.method, req.url);

				if (scope.isPersisted) {
					break;
				}

				scope.counter--;

				if (scope.counter === 0) {
					// Remove the mock from the list after all requests have been handled
					this.mocks = this.mocks.filter((m) => m !== mock);
					break;
				}
			} catch (err: any) {
				log('error in connect matcher, continue with the next mock, %s, %s error: %s', req.method, req.url, err);

				if (scope) {
					scope.error = err;
				}
			}
		}

		if (matched === false) {
			log('no mock handler matched, continue with the next handler, %s, %s', req.method, req.url);
			if (scope) {
				scope.error = new Error(`No connect mock matched for request ${req.method} ${req.url}`);
			}
		}
	}

	/**
	 * Removes all registered mocks, even if they has not been called.
	 * This is useful for tests that require a clean state between persistent mocked requests.
	 */
	reset() {
		this.mocks = [];
	}

	/**
	 * Stop the server.
	 */
	async stop(): Promise<void> {
		this.mocks = [];
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

	/**
	 *	When you setup a mock with mock() and the request matches, the mock server will return the response.
	 *	If the request does not match, the mock server will return a 404 response and the call to scope.done() will fail the test.
	 *	You have also the ability to throw an error inside the response function to fail the mock.
	 *	This is useful if you want to verify with test assertion that the request is correct.
	 *	A thrown error is handled as an unmatched request and the next mock will be checked.
	 */
	mock<Response = any>(options: MockRequestOptions<Response>) {
		const scope = new Scope({
			counter: options?.times,
			persist: options?.persist,
		});

		this.mocks.push({
			type: 'request',
			match: options.match,
			handler: options.handler,
			scope,
		});

		return scope;
	}

	/**
	 * Assert that a https or wss requests occur. The handler is called when the request matches.
	 * Use this, if you want to test WG_HTTP_PROXY feature.
	 * You can use test assertions in the handler to verify the request.
	 * If error is thrown the handler is skipped and the next handler is called.
	 */
	assertHTTPConnect(match: (req: Request) => Promise<boolean> | boolean) {
		const scope = new Scope();

		this.mocks.push({
			type: 'connect',
			scope,
			match,
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
