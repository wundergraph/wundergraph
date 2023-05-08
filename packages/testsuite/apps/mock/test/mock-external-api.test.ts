import { expect, beforeAll, describe, it } from 'vitest';
import { join } from 'path';
import { TestServers, createTestAndMockServer } from '../.wundergraph/generated/testing';
import { createClient } from '../.wundergraph/generated/client';
import { TestContext } from '../types';
import { mockSearchResponse } from './mocks/mockSearchResponse';

let ts: TestServers;

beforeAll(async (ctx) => {
	ts = createTestAndMockServer({
		// The directory where your wundergraph directory is located
		dir: join(__dirname, '..'),
		createClient: (cfg) => {
			return createClient({
				...cfg,
				requestTimeoutMs: 1000,
			});
		},
	});

	return ts.start({
		// Environment variables replaced by the test mock server URL
		mockURLEnvs: ['COUNTRIES_URL', 'OS_NODE_URL'],
	});
});

describe('Mock external api', () => {
	it<TestContext>('Should mock search call to OpenSearch', async () => {
		// Mock the search endpoint of OpenSearch
		const scope = ts.mockServer.mock<Record<string, any>>(
			({ url, method }) => {
				return url.path === '/books/_search' && method === 'POST';
			},
			async ({ json }) => {
				expect(await json()).toEqual({
					query: {
						match: {
							title: {
								query: 'The Outsider',
							},
						},
					},
				});

				return {
					body: mockSearchResponse,
				};
			}
		);

		const result = await ts.testServer.client().query({
			operationName: 'search',
		});

		scope.done();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data).toEqual(mockSearchResponse);
	});

	it<TestContext>('Should handle mocks per request.', async () => {
		const scope1 = ts.mockServer.mock<Record<string, any>>(
			({ url, method }) => {
				return url.path === '/books/_search' && method === 'POST';
			},
			async ({ json }) => {
				expect(await json()).toEqual({
					query: {
						match: {
							title: {
								query: 'The Outsider',
							},
						},
					},
				});

				return {
					body: {
						a: 1,
					},
				};
			}
		);

		const scope2 = ts.mockServer.mock<Record<string, any>>(
			({ url, method }) => {
				return url.path === '/books/_search' && method === 'POST';
			},
			async ({ json }) => {
				expect(await json()).toEqual({
					query: {
						match: {
							title: {
								query: 'The Outsider',
							},
						},
					},
				});

				return {
					body: {
						a: 2,
					},
				};
			}
		);

		let result = await ts.testServer.client().query({
			operationName: 'search',
		});

		scope1.done();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data).toEqual({ a: 1 });

		result = await ts.testServer.client().query({
			operationName: 'search',
		});

		scope2.done();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data).toEqual({ a: 2 });
	});

	it<TestContext>('Should try next handlers when the first does not match or throws', async () => {
		const scope1 = ts.mockServer.mock<Record<string, any>>(
			({ url, method }) => {
				expect.fail('Should not be called');
			},
			({ json }) => {
				expect.fail('Should not be called');
			}
		);

		const scope2 = ts.mockServer.mock<Record<string, any>>(
			({ url, method }) => {
				return url.path === '/books/_search' && method === 'POST';
			},
			async ({ json }) => {
				expect(await json()).toEqual({
					query: {
						match: {
							title: {
								query: 'The Outsider',
							},
						},
					},
				});

				return {
					body: {
						a: 2,
					},
				};
			}
		);

		let result = await ts.testServer.client().query({
			operationName: 'search',
		});

		expect(ts.mockServer.pendingRequestInterceptors().length).greaterThan(0);
		expect(scope1.isDone).toEqual(false);
		expect(scope1.error).toBeDefined();

		scope2.done();
		expect(scope2.isDone).toEqual(true);
		expect(scope2.error).toBeUndefined();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data).toEqual({ a: 2 });
	});

	it<TestContext>('Should error because handler does not match', async () => {
		// Mock the search endpoint of OpenSearch
		const scope = ts.mockServer.mock(
			({ url, method }) => {
				return url.path === '/does_not_match';
			},
			() => {
				return {
					body: 'This should not be returned',
				};
			}
		);

		try {
			await ts.testServer.client().query({
				operationName: 'search',
			});
		} catch (err: any) {
			expect(err.message).toEqual('This operation was aborted');
		}

		expect(() => scope.done()).toThrow('No interceptor matched for request POST /books/_search');
	});
});
