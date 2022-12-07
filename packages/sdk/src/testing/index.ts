import net from 'net';

import { Subprocess, wunderctlSubprocess } from '../wunderctlexec';
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
	 * Enable debug logging
	 *
	 * @default false
	 */
	debug: boolean;
}

export interface TestOptions {}

type TestPlainFn = (server: Server) => void;
type TestPromiseFn = (server: Server) => Promise<void>;

type TestFn = TestPlainFn | TestPromiseFn;

/**
 * Wrapper around the WunderGraph node, intended to simplify
 * running tests within WunderGraph applications.
 */
export class Server<ClientType extends Client = Client> {
	private readonly options: ServerOptions<ClientType>;
	private nodeUrl: string = '';
	private subprocess?: Subprocess;
	private runningTestCount: number = 0;

	/**
	 * Initialize a Server instance. Typically, a shared Server will
	 * be used for all tests. Starting and stopping the server manully
	 * is not required in most cases. Use Server.test to wrap your
	 * test functions instead.
	 *
	 * @param opts Optional ServerOptions
	 */
	constructor(opts?: Partial<ServerOptions<ClientType>>) {
		this.options = this.applyOptions(opts);
	}

	private applyOptions(opts?: Partial<ServerOptions<ClientType>>): ServerOptions<ClientType> {
		if (typeof fetch === 'undefined' && !opts?.fetch) {
			throw new Error(`fetch() is not defined - use ServerOptions.fetch to provide it`);
		}
		const defaultOptions: ServerOptions<ClientType> = {
			createClient: () => {
				throw new Error(
					'cannot create a client because createClient() is not available - use ServerOptions.createClient to provide it'
				);
			},
			fetch: opts?.fetch ?? fetch,
			startupTimeoutSeconds: 5,
			debug: false,
		};
		return {
			...defaultOptions,
			...opts,
		};
	}

	private url(rel: string): string {
		return this.nodeUrl + rel;
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
	async setUp(): Promise<void> {
		if (this.subprocess) {
			// Already running
			return;
		}
		let { manageServer, env } = await this.setupEnvironment();
		this.nodeUrl = env['WG_NODE_URL'];
		let subprocess: Subprocess | undefined;
		if (manageServer) {
			let cmd = ['start'];
			if (this.options.debug || process.env.WG_TEST_DEBUG) {
				cmd.push('--debug', '--pretty-logging');
			} else {
				cmd.push('--cli-log-level', 'warning');
			}
			subprocess = wunderctlSubprocess({ cmd, env });
			subprocess?.stdout?.pipe(process.stdout);
			subprocess?.stderr?.pipe(process.stderr);
		}
		const health = this.url('/health');
		const started = new Date().getTime();
		const maxWaitMs = this.options.startupTimeoutSeconds * 1000;
		while (true) {
			try {
				const controller = new AbortController();
				const id = setTimeout(() => controller.abort(), 500);
				const resp = await this.options.fetch(health, { signal: controller.signal });
				clearTimeout(id);
				if (resp.status == 200) {
					const data = await resp.json();
					break;
				}
			} catch (e: any) {
				if (maxWaitMs > 0 && new Date().getTime() - started > maxWaitMs) {
					await this.tearDown();
					throw new Error(`could not start WunderGraph node: ${e}`);
				}
			}
		}
		// Server is up and running
		this.subprocess = subprocess;
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
			} catch (e: any) {
				console.error(`error shutting down ${e}`);
			}
			this.subprocess = undefined;
		}
	}

	private async beforeTest(): Promise<void> {
		this.runningTestCount++;
		return this.setUp();
	}

	private async afterTest(): Promise<void> {
		if (--this.runningTestCount == 0) {
			// Wait 100ms to tear down, so if multiple tests
			// are ran in a sequence, we avoid tearing down
			// and setting the server for each one of them.
			setTimeout(async () => {
				if (this.runningTestCount == 0) {
					return this.tearDown();
				}
			}, 100);
		}
	}

	/**
	 * Wrap a test function to automatically set up the server and tear it down (if needed)
	 *
	 * @param fn Test function to run
	 * @param opts Optional TestOptions
	 * @returns Async function wrapping the test function
	 */
	test(fn: TestFn, opts?: TestOptions): () => Promise<void> {
		return async (): Promise<void> => {
			try {
				await this.beforeTest();
				await fn(this);
			} finally {
				await this.afterTest();
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
	 * the testing framework to serve requests.
	 *
	 * @returns A ClientConfig-compatible object
	 */
	clientConfig(): ClientConfigInit {
		return {
			baseURL: this.nodeUrl,
			customFetch: this.options.fetch,
		};
	}

	private async freeport(): Promise<number> {
		const server = net.createServer();
		await new Promise<void>((resolve, reject) => server.listen(0, resolve).on('error', reject));
		const address = server.address() as net.AddressInfo;
		const port = address.port;
		await new Promise((resolve) => server.close(resolve));
		return port;
	}

	private async setupEnvironment(): Promise<{ manageServer: boolean; env: Record<string, string> }> {
		if (process.env.WG_NODE_URL) {
			// Assume there's a server running managed by someone else,
			// trim trailing slash and proceed
			const url = process.env.WG_NODE_URL.replace(/\/+$/, '');
			return {
				manageServer: false,
				env: { WG_NODE_URL: url },
			};
		}
		// Generate random ports
		let nodePort = await this.freeport();
		let serverPort = await this.freeport();
		return {
			manageServer: true,
			env: {
				WG_CLOUD: 'true',
				WG_NODE_URL: `http://localhost:${nodePort}`,
				WG_NODE_HOST: '0.0.0.0',
				WG_NODE_PORT: nodePort.toString(),
				WG_SERVER_URL: `http://localhost:${serverPort}`,
				WG_SERVER_HOST: '0.0.0.0',
				WG_SERVER_PORT: serverPort.toString(),
			},
		};
	}
}
