import { beforeAll, describe, expect, it } from 'vitest';
import { TestServers, createTestAndMockServer } from './.wundergraph/generated/testing';
import { TestContext } from './types';

let ts: TestServers;

beforeAll(async (ctx) => {
	ts = createTestAndMockServer({
		// The directory where your wundergraph directory is located
		dir: __dirname,
	});

	return await ts.start({
		// Environment variables replaced by the test mock server URL
		mockURLEnvs: ['ONE_OF_URL'],
	});
});

describe('The WunderGraph ORM - input unions', () => {
	it<TestContext>('Should handle input unions request', async () => {
		const scope = ts.mockServer.mock<Record<string, any>>({
			match: ({ url, method }) => {
				return url.path === '/test' && method === 'POST';
			},
			handler: async ({ json }) => {
				return await json();
			},
		});

		const result = await ts.testServer.client().query({
			operationName: 'ts/input-unions',
		});

		scope.done();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data).toEqual({
			responseA: 'A',
			responseB: { B: 'VALUE' },
		});
	});
});
