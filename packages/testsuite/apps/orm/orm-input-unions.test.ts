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
		mockURLEnvs: ['ORM_UNION_TYPES_URL'],
	});
});

describe('The WunderGraph ORM - input unions', () => {
	it<TestContext>('Should handle input unions request', async () => {
		const scope = ts.mockServer.mock<Record<string, any>>({
			match: ({ url, method }) => {
				return url.path === '/test' && method === 'POST';
			},
			handler: async ({ json }) => {
				const j = await json();
				return {
					body: JSON.stringify(j),
				};
			},
			times: 2,
		});

		const result = await ts.testServer.client().query({
			operationName: 'ts/input-unions',
		});

		scope.done();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data).toEqual({
			responseA: {
				A_const: 'A',
				__typename: 'A_const_container',
			},
			responseB: {
				B: 'VALUE',
				__typename: 'mutation_test_endpoint_oneOf_1',
			},
		});
	});
});
