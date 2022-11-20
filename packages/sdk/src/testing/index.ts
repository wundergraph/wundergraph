import fastify, { FastifyInstance, FastifyRequest } from 'fastify';

import { Subprocess, wunderctlExec, wunderctlSubprocess } from '../wunderctlexec';

import { HTTPMock, HttpMockFn, Headers, Request, RequestImpl, HTTPMockOptions } from './http';

export type { Request, HTTPMockOptions } from './http';
export { Headers, Response } from './http';

type FetchFn = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>;

export interface ServerOptions {
	/**
	 * fetch function to use internally.
	 *
	 * @default global fetch, if available
	 */
	fetch: FetchFn;
	/**
	 * Time to wait for the WunderGraph node to start up,
	 * in seconds.
	 *
	 * @default 5
	 */
	startupTimeoutSeconds: number;
	/**
	 * Wether to automatically tear down the server after each
	 * test.
	 *
	 * @default true
	 */
	tearDown: boolean;
}

export interface TestOptions {
	/**
	 * Wether to tear down the server after the test. This is only
	 * useful when ServerOptions.tearDown is false.
	 *
	 * @default false
	 */
	tearDown: boolean;
}

type TestPlainFn = (server: Server) => void;
type TestPromiseFn = (server: Server) => Promise<void>;

type TestFn = TestPlainFn | TestPromiseFn;

/**
 * Wrapper around the WunderGraph node, intended to simplify
 * running tests within WunderGraph applications.
 */
export class Server {
	private readonly rootUrl: URL;
	private readonly options: ServerOptions;
	private readonly httpMocks: HTTPMock[];
	private server?: FastifyInstance;
	private serverAddr?: string;
	private subprocess?: Subprocess;

	/**
	 * Initialize a Server instance. Typically, a shared Server will
	 * be used for all tests. Starting and stopping the server manully
	 * is not required in most cases. Use Server.test to wrap your
	 * test functions instead.
	 *
	 * @param opts Optional ServerOptions
	 */
	constructor(opts?: Partial<ServerOptions>) {
		const result = wunderctlExec({
			cmd: ['node', 'url'],
		});
		if (result?.failed) {
			throw new Error(result?.stderr);
		}
		const url = result?.stdout.trim();
		if (!url) {
			throw new Error('could not determine node URL');
		}
		try {
			this.rootUrl = new URL(url);
		} catch (e: any) {
			throw new Error(`invalid node URL: ${e}`);
		}
		this.options = this.applyOptions(opts);
		this.httpMocks = [];
	}

	private applyOptions(opts?: Partial<ServerOptions>): ServerOptions {
		if (typeof fetch === 'undefined' && !opts?.fetch) {
			throw new Error(`fetch() is not defined - use ServerOptions.fetch to provide it`);
		}
		const defaultOptions: ServerOptions = {
			fetch: opts?.fetch ?? fetch,
			startupTimeoutSeconds: 5,
			tearDown: true,
		};
		return {
			...defaultOptions,
			...opts,
		};
	}

	private url(rel: string): string {
		return this.rootUrl + rel;
	}

	/**
	 * Start the server. If the server is already running,
	 * it does nothing.
	 */
	async spinUp(): Promise<void> {
		await this.startHTTPServer();
		if (this.subprocess) {
			// Already running
			return;
		}
		let cmd = ['up', '--intercept-http', `${this.serverAddr ?? ''}/http`];
		this.subprocess = wunderctlSubprocess({ cmd });
		this.subprocess?.stdout?.pipe(process.stdout);
		this.subprocess?.stderr?.pipe(process.stderr);
		const health = this.url('/health');
		const started = new Date().getTime();
		const maxWaitMs = this.options.startupTimeoutSeconds * 1000;
		while (true) {
			try {
				const controller = new AbortController();
				const id = setTimeout(() => controller.abort(), 50);
				const result = await this.options.fetch(health, { signal: controller.signal });
				clearTimeout(id);
				if (result.status == 200) {
					break;
				}
			} catch (e: any) {
				if (maxWaitMs > 0 && new Date().getTime() - started > maxWaitMs) {
					await this.tearDown();
					throw new Error(`could not start WunderGraph node: ${e}`);
				}
			}
		}
	}

	/**
	 * Stop the server. If the server isn't running,
	 * it does nothing.
	 */
	async tearDown(): Promise<void> {
		await this.stopHTTPServer();
		if (this.subprocess) {
			this.subprocess.kill('SIGTERM', {
				forceKillAfterTimeout: 3000,
			});
			try {
				await this.subprocess;
			} catch (e: any) {}
			this.subprocess = undefined;
		}
	}

	private async tearDownIfNeeded(opts?: TestOptions): Promise<void> {
		if (this.options.tearDown || opts?.tearDown) {
			return this.tearDown();
		}
	}

	private async startHTTPServer(): Promise<void> {
		if (this.server) {
			return;
		}
		const server = fastify();
		await this.setupHTTPServer(server);
		this.server = server;
		this.serverAddr = await this.server.listen();
	}

	private async setupHTTPServer(server: FastifyInstance): Promise<void> {
		await server.register(require('@fastify/formbody'));
		server.addContentTypeParser(/.*/, (_, body, done) => done(null, body));
		server.all('/http', async (request, reply) => {
			const handler = this.matchHTTPMockHandler(request);
			if (handler) {
				const resp = await handler(this.convertRequest(request));
				for (const [k, v] of resp.headers) {
					reply.header(k, v);
				}
				reply.status(resp.status);
				return await resp.text();
			}
			reply.status(599);
		});
	}

	private async stopHTTPServer(): Promise<void> {
		if (!this.server) {
			return;
		}
		this.server.close();
		this.server = undefined;
		this.serverAddr = undefined;
	}

	private matchHTTPMockHandler(request: FastifyRequest): HttpMockFn | undefined {
		const url = request.raw.headers['x-request-url'];
		for (let mock of this.httpMocks) {
			if (mock.url === url && (!mock.method || mock.method.toUpperCase() == request.method.toUpperCase())) {
				return mock.handler;
			}
		}
		return undefined;
	}

	private convertRequest(request: FastifyRequest): Request {
		const url = request.raw.headers['x-request-url'] as string;
		let headers = new Headers();
		for (const key in request.headers) {
			if (key !== 'x-request-url') {
				const values = request.headers[key];
				if (values) {
					if (Array.isArray(values)) {
						headers.set(key, (values as string[]).join(','));
					} else {
						headers.set(key, values);
					}
				}
			}
		}
		const body = ((request.body as any)?.raw ?? '') as string;
		return new RequestImpl(request.method, url, headers, body);
	}

	/**
	 * Register a mock for HTTP(s) requests to the given URL
	 */
	httpMock(url: string, handler: HttpMockFn, opts?: Partial<HTTPMockOptions>) {
		this.httpMocks.push({
			url: url,
			method: opts?.method ?? '',
			handler,
		});
	}

	/**
	 * Wrap a test function to automatically spin up the server and tear it down (if needed)
	 *
	 * @param fn Test function to run
	 * @param opts Optional TestOptions
	 * @returns Async function wrapping the test function
	 */
	test(fn: TestFn, opts?: TestOptions): () => Promise<void> {
		return async (): Promise<void> => {
			try {
				await this.spinUp();
				await fn(this);
			} catch (e: any) {
				await this.tearDown();
				throw e;
			} finally {
				await this.tearDownIfNeeded(opts);
			}
		};
	}

	/** Shorthand method for creating a test with Server.test() and running it
	 * @param fn Test function to run
	 * @param opts Optional TestOptions
	 * @returns Nothing
	 */
	runTest(fn: TestFn, opts?: TestOptions): Promise<void> {
		return this.test(fn, opts)();
	}
}
