import { WunderGraphMockServer } from './mock-server';
import { WunderGraphTestServer } from './test-server';

export interface ServerStartOptions {
	/**
	 * Environment variables that should be set to the mock server url.
	 * This assumes that you use `process.env` or `new EnvironmentVariable()` to access environment variables.
	 */
	mockURLEnvs?: Array<string>;
	/**
	 * Additional environment variables to set.
	 */
	env?: Record<string, string>;
}

export class TestServers {
	constructor(public mockServer: WunderGraphMockServer, public testServer: WunderGraphTestServer) {}

	public async start(options?: ServerStartOptions) {
		await this.mockServer.start();

		const msUrl = this.mockServer.url();
		const env: Record<string, string> = { WG_HTTP_PROXY: this.mockServer.url(), ...options?.env };

		if (options?.mockURLEnvs) {
			for (const envVar of options.mockURLEnvs) {
				env[envVar] = msUrl;
			}
		}

		await this.testServer.start({
			env,
		});

		return async () => {
			const shutdown = [];
			if (this.mockServer) {
				shutdown.push(this.mockServer.stop());
			}
			if (this.testServer) {
				shutdown.push(this.testServer.stop());
			}
			await Promise.all(shutdown);
		};
	}
}
