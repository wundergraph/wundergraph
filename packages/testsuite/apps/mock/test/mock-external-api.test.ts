import { expect, beforeEach, describe, it } from 'vitest';
import { join } from 'path';
import { createTestAndMockServer } from '../.wundergraph/generated/testing';
import { TestContext } from '../types';
import { mockSearchResponse } from './mocks/mockSearchResponse';

beforeEach<TestContext>(async (ctx) => {
	const ts = createTestAndMockServer({
		// The directory where your wundergraph directory is located
		dir: join(__dirname, '..'),
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
			},
			async (req) => {
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
});
