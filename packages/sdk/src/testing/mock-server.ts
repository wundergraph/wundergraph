import { Straightforward, Request, RequestContext, ConnectContext, Next } from '@wundergraph/straightforward';
import debug from 'debug';
import { freeport, getBody } from './util';
import { IncomingHttpHeaders } from 'http';
import { PublicScope, Scope } from './scope';

const log = debug('wunderctl:mock-server');

export interface RequestMock<Response = any> {
	type: 'request';
	scope: Scope;
	/**
	 * The matcher function. Return true if the mock should be used.
	 * You can use test assertions in the handler to verify the request.
	 * If error is thrown the handler is skipped and the next handler is called.
	 */
	match: (req: MockRequest) => Promise<boolean> | boolean;
	/**
	 * The handler function. Return the mocked response.
	 * You can use test assertions in the handler to verify the request.
	 * If error is thrown the handler is skipped and the next handler is called.
	 */
	handler: (req: MockRequest) => Promise<MockResponse<Response>> | MockResponse<Response>;
}

export interface ConnectMock {
	type: 'connect';
	scope: Scope;
	/**
	 * The matcher function. Return true if the request should be asserted.
	 */
	match: (req: Request) => Promise<boolean> | boolean;
}

export type Mock = RequestMock | ConnectMock;

export interface MockResponse<Response = any> {
	status?: number;
	headers?: Record<string, string>;
	body?: Response;
}

export interface MockRequestOptions<Response = any> extends Omit<RequestMock<Response>, 'scope' | 'type'> {
	times?: number;
	persist?: boolean;
}

export interface AssertConnectOptions<Response = any> extends Omit<ConnectMock, 'scope' | 'type'> {}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

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

export interface InternalMockRequest {
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
	 * Return the raw request buffer.
	 */
	raw(): Promise<Buffer>;

	/**
	 * The parsed request body.
	 */
	_body?: any;
}

export interface MockRequest extends Omit<InternalMockRequest, '_body'> {}

export class WunderGraphMockServer {
	private proxy: Straightforward;
	private port: number;
	private mocks: Mock[];
	private requests: WeakMap<Request, MockRequest>;

	constructor() {
		this.proxy = new Straightforward();
		this.port = 0;
		this.mocks = [];
		this.requests = new WeakMap<Request, MockRequest>();
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
				let req: Request = ctx.req;
				let res = ctx.res;

				res.writeHead(404);
				res.write(`Mock not found, method: ${req.method} url: ${req.url}`);
				res.end();
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

		let requestMocks = this.mocks.filter((mock) => mock.type === 'request');

		if (requestMocks.length === 0) {
			log('you did not define any request mocks for: %s %s', req.method, req.url);
			return;
		}

		let userMockReq: MockRequest | undefined = undefined;

		if (this.requests.has(req)) {
			userMockReq = this.requests.get(req);
		} else {
			const mockReq: Omit<InternalMockRequest, 'json' | 'text' | 'raw'> = {
				headers: req.headers,
				url: req.locals.urlParts,
				method: req.method as HTTPMethod,
			};

			// We read the body only once, so we can use it multiple times
			const raw = async (): Promise<Buffer> => {
				if (mockReq._body) {
					return mockReq._body;
				}
				mockReq._body = await getBody(req);
				return mockReq._body;
			};
			const json = async <Body = any>(): Promise<Body> => {
				if (mockReq._body) {
					return JSON.parse(mockReq._body.toString());
				}
				mockReq._body = await getBody(req);
				return JSON.parse(mockReq._body.toString());
			};
			const text = async (): Promise<string> => {
				if (mockReq._body) {
					return mockReq._body.toString();
				}
				mockReq._body = await getBody(req);
				return mockReq._body.toString();
			};

			this.requests.set(req, {
				...mockReq,
				json,
				text,
				raw,
			});

			// Cache the request object for the next mock
			userMockReq = this.requests.get(req);
		}

		// This should never happen
		if (!userMockReq) {
			throw new Error('Could not find the mock request');
		}

		for (let mock of this.mocks) {
			scope = mock.scope;

			if (mock.type !== 'request') {
				continue;
			}

			try {
				// Skip if the request does not match, try the next mock
				if (!(await mock.match(userMockReq))) {
					log('request did not match mock: %s %s', req.method, req.url);
					continue;
				}

				log('request matched with mock: %s %s', req.method, req.url);

				const mockRes = await mock.handler(userMockReq);

				scope.state.matched = true;
				scope.state.pending++;

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

				if (scope.options?.persist) {
					break;
				}

				scope.state.counter--;

				if (scope.state.counter === 0) {
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
					scope.state.error = err;
				}
			} finally {
				scope.state.pending--;
			}
		}

		if (scope?.state.matched === false) {
			log('no mock handler matched, continue with the next handler, %s, %s', req.method, req.url);

			if (scope && !scope.state.error) {
				scope.state.error = new Error(`No mock matched for request ${req.method} ${req.url}`);
			}

			await next();
		}
	}

	private async handleConnect(ctx: ConnectContext) {
		let req: Request = ctx.req;

		let scope: Scope | undefined = undefined;

		let connectMocks = this.mocks.filter((mock) => mock.type === 'connect');

		if (connectMocks.length === 0) {
			log('you did not define any connect mocks for: %s %s', req.method, req.url);
			return;
		}

		for (let mock of connectMocks) {
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

				scope.state.matched = true;
				scope.state.pending++;

				log('connect request matched with mock: %s %s', req.method, req.url);

				if (scope.options?.persist) {
					break;
				}

				scope.state.counter--;

				if (scope.state.counter === 0) {
					// Remove the mock from the list after all requests have been handled
					this.mocks = this.mocks.filter((m) => m !== mock);
					break;
				}
			} catch (err: any) {
				log('error in connect matcher, continue with the next mock, %s, %s error: %s', req.method, req.url, err);

				if (scope) {
					scope.state.error = err;
				}
			} finally {
				scope.state.pending--;
			}
		}

		if (scope?.state.matched === false) {
			log('no mock handler matched, continue with the next handler, %s, %s', req.method, req.url);
			if (scope) {
				scope.state.error = new Error(`No connect mock matched for request ${req.method} ${req.url}`);
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

		return scope as PublicScope;
	}

	/**
	 * Returns an array of all pending mocks.
	 */
	pendingMocks() {
		return this.mocks;
	}

	/**
	 * Assert that a https or wss requests occur. The handler is called when the request matches.
	 * Use this, if you want to test WG_HTTP_PROXY feature.
	 * You can use test assertions in the handler to verify the request.
	 * If error is thrown the handler is skipped and the next handler is called.
	 */
	assertHTTPConnect(options: AssertConnectOptions) {
		const scope = new Scope();

		this.mocks.push({
			type: 'connect',
			scope,
			match: options.match,
		});

		return scope as PublicScope;
	}
}
