import { describe, it } from 'vitest';
import { WunderGraphMockServer, WunderGraphTestServer, WunderGraphTestServers } from '@wundergraph/sdk/testing';

describe('Stop servers', () => {
	it('Should be possible to stop the server with the cleanup function returned by stop()', async () => {
		const server = new WunderGraphTestServers(new WunderGraphMockServer(), new WunderGraphTestServer());
		const cleanup = await server.start();
		await cleanup();
	});
	it('Should be possible to stop the server with stop()', async () => {
		const server = new WunderGraphTestServers(new WunderGraphMockServer(), new WunderGraphTestServer());
		await server.start();
		await server.stop();
	});
});
