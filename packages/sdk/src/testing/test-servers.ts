import { WunderGraphMockServer } from './mock-server';
import { WunderGraphTestServer } from './test-server';

export interface ServerStartOptions {
	/**
	 * List of APIs to mock.
	 */
	mockedAPIs?: Array<string>;
	/**
	 * Environment variables to set. Overrides the default values.
	 */
	env?: Record<string, string>;
}

export class TestServers {
	constructor(public mockServer: WunderGraphMockServer, public testServer: WunderGraphTestServer) {}

	public async start(options?: ServerStartOptions) {
		await this.mockServer.start();

		const msUrl = this.mockServer.url();
		const env: Record<string, string> = { WG_HTTP_PROXY: this.mockServer.url(), ...options?.env };

		if (options?.mockedAPIs) {
			for (const envVar of options.mockedAPIs) {
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
