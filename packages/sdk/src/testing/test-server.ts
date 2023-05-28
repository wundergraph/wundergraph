import { Client, CreateClientConfig } from '../client';
import { Subprocess, wunderctl } from '../wunderctlexec';
import { retry } from 'ts-retry-promise';
import { join } from 'node:path';
import terminate from 'terminate/promise';
import { freeport, fileExists } from './util';

type FetchFn = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>;

export interface ServerStartOptions {
	/**
	 * Additional environment variables to pass to the test server.
	 * Existing environment variables are always inherited.
	 *
	 * @default None
	 */
	env?: Record<string, string>;
}
export interface ServerOptions<ClientType extends Client = Client> {
	/**
	 * createClient from the generated TypeScript WunderGraph client.
	 * Allows getting the client with appropriate options via Server.client.
	 */
	createClient: (config?: CreateClientConfig) => ClientType;

	/**
	 * fetch function to use internally.
	 *
	 * @default global fetch, if available
	 */
	fetch: FetchFn;

	/**
	 * Enable debug logging
	 *
	 * @default false
	 */
	debug: boolean;

	/**
	 * The WunderGraph directory to use.
	 * By default, the current working directory is used.
	 */
	dir?: string;

	/**
	 * Additional environment variables to pass to the test server.
	 * Existing environment variables are always inherited.
	 * By default, the WunderGraph loads the `.env.test` file at the WunderGraph directory.
	 *
	 * @default None
	 */
	env?: Record<string, string>;
}

/**
 * Wrapper around the WunderGraph node, intended to simplify
 * running tests within WunderGraph applications.
 */
export class WunderGraphTestServer<ClientType extends Client = Client> {
	private readonly options: ServerOptions<ClientType>;
	private nodeUrl: string = '';
	private stopped = false;
	private subprocess?: Subprocess;
	private promPort: string = '';

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
			debug: false,
		};
		return {
			...defaultOptions,
			...opts,
		};
	}

	/**
	 * Given a relative URL, url returns its absolute URL for on a running test server.
	 * If the server is not running, an error is thrown.
	 *
	 * @param rel Relative URL
	 * @returns Absolute URL pointing to the test server.
	 */
	url(rel?: string): string {
		if (!this.nodeUrl) {
			throw new Error('server is not running');
		}
		return this.nodeUrl + (rel || '');
	}

	/**
	 * graphqlEndpoint returns the absolute URL to the GraphQL endpoint for a running test
	 * server. If the server is not running, it throws an error.
	 *
	 * @returns Absolute URL to GraphQL endpoint
	 */
	graphqlEndpoint(): string {
		return this.url('/graphql');
	}

	/**
	 * promMetricEndpoint returns the absolute URL to the Prometheus metric endpoint.
	 * If the server is not running, an error is thrown.
	 *
	 * @returns Absolute URL to Prometheus metric endpoint
	 */
	promMetricEndpoint(): string {
		if (!this.nodeUrl) {
			throw new Error('server is not running');
		}
		return `http://0.0.0.0:${this.promPort}/metrics`;
	}

	/**
	 * Create a WunderGraph TypeScript client
	 *
	 * @returns Client configured for testing
	 */
	client(): ClientType {
		return this.options.createClient(this.createClientConfig());
	}

	/**
	 * Start the server. If the server is already running,
	 * it does nothing.
	 */
	async start(opts?: ServerStartOptions): Promise<void> {
		if (this.subprocess) {
			// Already running
			return;
		}
		let { manageServer, env } = await this.setupEnvironment();
		this.nodeUrl = env['WG_NODE_URL'];
		this.promPort = env['WG_PROMETHEUS_PORT'];

		let subprocess: Subprocess | undefined;
		if (manageServer) {
			let cmd = ['start'];
			env = { ...env, ...(this.options.env ?? {}), ...(opts?.env ?? {}) };
			if (this.options.debug || process.env.WG_TEST_DEBUG) {
				cmd.push('--debug', '--pretty-logging');
			} else {
				cmd.push('--cli-log-level', 'error');
			}

			if (this.options.dir) {
				cmd.push('--wundergraph-dir', this.options.dir);

				// We try first to load the .env.test file, if it exists
				// and fallback to .env if it doesn't
				if (await fileExists(join(this.options.dir, '.env.test'))) {
					cmd.push('--env', join(this.options.dir, '.env.test'));
				} else if (await fileExists(join(this.options.dir, '.env'))) {
					cmd.push('--env', join(this.options.dir, '.env'));
				}
			} else if (await fileExists('.env.test')) {
				cmd.push('--env', '.env.test');
			} else if (await fileExists('.env')) {
				cmd.push('--env', '.env');
			}

			subprocess = wunderctl({ cmd, env, stdio: 'inherit' });
		} else {
			// Make sure we show a warning about the ignored environment
			// variables, otherwise this could be complicated to debug
			const environmentKeys = Object.keys(this.options.env ?? {});
			if (environmentKeys.length > 0) {
				console.warn(`ignoring environment variables ${environmentKeys.join(', ')}, server is already running`);
			}
		}
		const health = this.url('/health');
		const checkHealth = async () => {
			const controller = new AbortController();
			const id = setTimeout(() => controller.abort(), 3000);
			try {
				const resp = await this.options.fetch(health, { signal: controller.signal });
				if (resp.status == 200) {
					return true;
				} else {
					throw new Error(`server is not yet ready`);
				}
			} finally {
				clearTimeout(id);
			}
		};
		try {
			await retry(checkHealth, { retries: 100, delay: 100 });
		} catch (e: any) {
			await this.stopSubprocess(subprocess);
			throw new Error(`could not start WunderGraph server: ${e}`);
		}
		// Server is up and running
		this.subprocess = subprocess;
	}

	/**
	 * Stop the server. If the server isn't running,
	 * it does nothing.
	 */
	async stop(): Promise<void> {
		if (this.stopped) {
			// Already stopped
			return;
		}

		this.stopped = true;

		await this.stopSubprocess(this.subprocess);

		this.stopped = false;
		this.subprocess = undefined;
	}
	/**
	 * Returns a configuration suitable for createClient() which allows
	 * the testing framework to serve requests.
	 *
	 * @returns A CreateClientConfig instance
	 */
	createClientConfig(): CreateClientConfig {
		if (!this.nodeUrl) {
			throw new Error(`testing server is not started`);
		}
		return {
			baseURL: this.nodeUrl,
			customFetch: this.options.fetch,
		};
	}

	private async stopSubprocess(proc?: Subprocess): Promise<void> {
		if (proc?.pid) {
			try {
				await terminate(proc.pid);
			} catch (e: any) {
				// Ignore if the process is already gone
				if (e.code !== 'ESRCH') {
					throw e;
				}
			}
		}
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
		const [nodePort, nodeInternalPort, serverPort, prometheusPort] = await Promise.all([
			freeport(),
			freeport(),
			freeport(),
			freeport(),
		]);

		return {
			manageServer: true,
			env: {
				WG_CLOUD: 'true',
				WG_NODE_URL: `http://0.0.0.0:${nodePort}`,
				WG_NODE_INTERNAL_URL: `http://0.0.0.0:${nodeInternalPort}`,
				WG_PUBLIC_NODE_URL: `http://0.0.0.0:${nodePort}`,
				WG_PROMETHEUS_PORT: `${prometheusPort}`,
				WG_NODE_HOST: '0.0.0.0',
				WG_NODE_PORT: nodePort.toString(),
				WG_NODE_INTERNAL_PORT: nodeInternalPort.toString(),
				WG_SERVER_URL: `http://0.0.0.0:${serverPort}`,
				WG_SERVER_HOST: '0.0.0.0',
				WG_SERVER_PORT: serverPort.toString(),
			},
		};
	}
}
