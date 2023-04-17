import net from 'net';

import { retry } from 'ts-retry-promise';
import terminate from 'terminate/promise';

import { Subprocess, wunderctl } from '../wunderctlexec';
import { Client } from '../client';
import { CreateClientConfig } from '../client/types';

const readyStatus = 'READY';
const skipStatus = 'SKIP';

interface ServerHealth {
	serverStatus: string;
	nodeStatus: string;
}

type FetchFn = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>;

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

	/***
	 * The WunderGraph directory to use.
	 */
	dir?: string;
}

/**
 * Wrapper around the WunderGraph node, intended to simplify
 * running tests within WunderGraph applications.
 */
export class WunderGraphTestServer<ClientType extends Client = Client> {
	private readonly options: ServerOptions<ClientType>;
	private nodeUrl: string = '';
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

	public url(rel?: string): string {
		return this.nodeUrl + rel;
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
	async start(): Promise<void> {
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
				cmd.push('--cli-log-level', 'error');
			}

			if (this.options.dir) {
				cmd.push('--wundergraph-dir', this.options.dir);
			}

			subprocess = wunderctl({ cmd, env, stdio: 'inherit' });
		}
		const health = this.url('/health');
		const checkHealth = async () => {
			const controller = new AbortController();
			const id = setTimeout(() => controller.abort(), 5000);
			try {
				const resp = await this.options.fetch(health, { signal: controller.signal });
				if (resp.status == 200) {
					const data = (await resp.json()) as ServerHealth;
					if (
						data.nodeStatus === readyStatus &&
						(data.serverStatus === readyStatus || data.serverStatus == skipStatus)
					) {
						return true;
					}
					throw new Error(`server is not yet ready ${data}`);
				}
			} finally {
				clearTimeout(id);
			}
		};
		try {
			await retry(checkHealth, { retries: 100 });
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
		await this.stopSubprocess(this.subprocess);
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
			await terminate(proc.pid);
		}
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
				WG_NODE_URL: `http://0.0.0.0:${nodePort}`,
				WG_NODE_HOST: '0.0.0.0',
				WG_NODE_PORT: nodePort.toString(),
				WG_SERVER_URL: `http://0.0.0.0:${serverPort}`,
				WG_SERVER_HOST: '0.0.0.0',
				WG_SERVER_PORT: serverPort.toString(),
			},
		};
	}
}
