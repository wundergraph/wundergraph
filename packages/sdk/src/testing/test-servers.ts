import { WunderGraphMockServer } from './mock-server';
import { WunderGraphTestServer } from './test-server';
import { Client } from '../client';

export interface TestServersStartOptions {
	/**
	 * Environment variables that should be set to the mock server url.
	 * This assumes that you use `process.env` or `new EnvironmentVariable()` to access environment variables.
	 */
	mockURLEnvs?: Array<string>;
	/**
	 * Additional environment variables to set.
	 */
	env?: Record<string, string>;
	/**
	 * Timeout in milliseconds to wait for servers to start.
	 *
	 * @default 30000
	 */
	timeout?: number;
}

export class WunderGraphTestServers<ClientType extends Client = Client> {
	constructor(
		public readonly mockServer: WunderGraphMockServer,
		public readonly testServer: WunderGraphTestServer<ClientType>
	) {}

	/**
	 * Start all servers.
	 */
	public async start(options?: TestServersStartOptions) {
		await this.mockServer.start();

		const msUrl = this.mockServer.url();
		const env: Record<string, string> = { ...options?.env };

		if (options?.mockURLEnvs) {
			for (const envVar of options.mockURLEnvs) {
				env[envVar] = msUrl;
			}
		}

		await this.testServer.start({
			env,
			timeout: options?.timeout,
		});

		return () => this.stop();
	}

	/**
	 * Stop all servers.
	 */
	public async stop() {
		await Promise.all([this.mockServer.stop(), this.testServer.stop()]);
	}
}
