import { expect, beforeEach, describe, it } from 'vitest';
import { join } from 'path';
import { createTestAndMockServer } from '../.wundergraph/generated/testing';
import { createClient } from '../.wundergraph/generated/client';
import { TestContext } from '../types';
import { mockSearchResponse } from './mocks/mockSearchResponse';

beforeEach<TestContext>(async (ctx) => {
	const ts = createTestAndMockServer({
		// The directory where your wundergraph directory is located
		dir: join(__dirname, '..'),
		createClient: (cfg) => {
			return createClient({
				...cfg,
				requestTimeoutMs: 1000,
			});
		},
	});

	ctx.ts = ts;

	return ts.start({
		// Environment variables replaced by the test mock server URL
		mockedAPIs: ['COUNTRIES_URL', 'OS_NODE_URL'],
	});
});

describe('Mock external api', () => {
	it<TestContext>('Should mock search call to OpenSearch', async ({ ts }) => {
		// Mock the search endpoint of OpenSearch
		const scope = ts.mockServer.mock<Record<string, any>>(
			async ({ url, method }) => {
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

	it<TestContext>('Should handle mocks per request.', async ({ ts }) => {
		const scope1 = ts.mockServer.mock<Record<string, any>>(
			async ({ url, method }) => {
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
			async ({ url, method }) => {
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
		expect(result.data.a).toEqual(1);

		result = await ts.testServer.client().query({
			operationName: 'search',
		});

		scope2.done();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data.a).toEqual(2);
	});

	it<TestContext>('Should try next handlers when the first does not match or throws', async ({ ts }) => {
		const scope1 = ts.mockServer.mock<Record<string, any>>(
			async ({ url, method }) => {
				expect.fail('Should not be called');
			},
			async ({ json }) => {
				expect.fail('Should not be called');
			}
		);

		const scope2 = ts.mockServer.mock<Record<string, any>>(
			async ({ url, method }) => {
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

		expect(ts.mockServer.pendingInterceptors().length).greaterThan(0);
		expect(scope1.isDone).toEqual(false);

		scope2.done();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data.a).toEqual(2);
	});

	it<TestContext>('Should error because handler does not match', async ({ ts }) => {
		// Mock the search endpoint of OpenSearch
		const scope = ts.mockServer.mock(
			async ({ url, method }) => {
				return url.path === '/does_not_match';
			},
			async () => {
				return {
					body: 'This should not be returned',
				};
			}
		);

		try {
			await ts.testServer.client().query({
				operationName: 'search',
			});
		} catch (e) {
			expect(e.message).toEqual('This operation was aborted');
		}

		expect(() => scope.done()).toThrow('no interceptor matched for request POST /books/_search');
	});
});
