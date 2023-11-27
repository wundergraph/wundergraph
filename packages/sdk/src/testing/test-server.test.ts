import { WunderGraphTestServer } from './test-server';

describe('test-server', () => {
	test('it should timeout', async () => {
		// this wont actually run because it's not in a wg project, but it's enough to test the timeout
		const server = new WunderGraphTestServer();

		await expect(server.start({ timeout: 100 })).rejects.toThrow();

		server.stop();
	});
});
