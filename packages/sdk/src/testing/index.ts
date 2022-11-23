import { Subprocess, wunderctlExec, wunderctlSubprocess } from '../wunderctlexec';
import { Client } from '../client';
import { ClientConfigInit } from '../client/types';

type FetchFn = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>;

export interface ServerOptions<ClientType extends Client = Client> {
	/**
	 * createClient from the generated TypeScript WunderGraph client.
	 * Allows getting the client with appropriate options via Server.client.
	 */
	createClient: (config?: ClientConfigInit) => ClientType;
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
export class Server<ClientType extends Client = Client> {
	private readonly rootUrl: URL;
	private readonly options: ServerOptions<ClientType>;
	private subprocess?: Subprocess;

	/**
	 * Initialize a Server instance. Typically, a shared Server will
	 * be used for all tests. Starting and stopping the server manully
	 * is not required in most cases. Use Server.test to wrap your
	 * test functions instead.
	 *
	 * @param opts Optional ServerOptions
	 */
	constructor(opts?: Partial<ServerOptions<ClientType>>) {
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
	}

	private applyOptions(opts?: Partial<ServerOptions<ClientType>>): ServerOptions<ClientType> {
		if (typeof fetch === 'undefined' && !opts?.fetch) {
			throw new Error(`fetch() is not defined - use ServerOptions.fetch to provide it`);
		}
		const defaultOptions: ServerOptions<ClientType> = {
			fetch: opts?.fetch ?? fetch,
			startupTimeoutSeconds: 5,
			tearDown: true,
			createClient: () => {
				throw new Error(
					'cannot create a client because createClient() is not available - use ServerOptions.createClient to provide it'
				);
			},
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
	 * Create a WunderGraph TypeScript client
	 *
	 * @returns Client configured for testing
	 */
	client(): ClientType {
		return this.options.createClient(this.clientConfig());
	}

	/**
	 * Start the server. If the server is already running,
	 * it does nothing.
	 */
	async spinUp(): Promise<void> {
		if (this.subprocess) {
			// Already running
			return;
		}
		let cmd = ['up'];
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

	/**
	 * Returns a configuration suitable for createClient() which allows
	 * the testing framework to intercept requests.
	 *
	 * @returns A ClientConfig-compatible object
	 */
	clientConfig(): { customFetch: any } {
		return {
			customFetch: this.options.fetch,
		};
	}
}
