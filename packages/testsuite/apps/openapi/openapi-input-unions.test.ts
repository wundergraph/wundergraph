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
		mockURLEnvs: ['OPEN_API_INPUT_UNIONS_URL'],
	});
});

describe('Input unions', () => {
	it<TestContext>('Should handle input unions request 1', async () => {
		const scope = ts.mockServer.mock<Record<string, any>>({
			match: ({ url, method }) => {
				return url.path === '/test' && method === 'POST';
			},
			handler: async ({ json }) => {
				const j = await json();
				expect(j).toEqual('A');
				return {
					body: JSON.stringify({
						B: 'VALUE',
					}),
				};
			},
		});

		const result = await ts.testServer.client().mutate({
			operationName: 'InputUnion',
			input: {
				input: {
					A_const: 'A',
				},
			},
		});

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data).toEqual({
			unions_test_endpoint: {
				B: 'VALUE',
			},
		});

		scope.done();
	});

	it<TestContext>('Should handle input unions request 2', async () => {
		const scope = ts.mockServer.mock<Record<string, any>>({
			match: ({ url, method }) => {
				return url.path === '/test' && method === 'POST';
			},
			handler: async ({ json }) => {
				expect(await json()).toEqual({ B: 'VAL' });
				return {
					body: JSON.stringify('A'),
				};
			},
		});

		const result = await ts.testServer.client().mutate({
			operationName: 'InputUnion',
			input: {
				input: {
					mutation_test_endpoint_oneOf_1_Input: {
						B: 'VAL',
					},
				},
			},
		});

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data).toEqual({
			unions_test_endpoint: {
				A_const: 'A',
			},
		});

		scope.done();
	});
});
