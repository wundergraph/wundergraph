import { expect, beforeEach, describe, it } from 'vitest';
import { join } from 'path';
import { createTestAndMockServer } from '../.wundergraph/generated/testing';
import { getJSONBody } from '@wundergraph/sdk/testing';
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
		expect.assertions(4);

		// Mock the countries origin API
		ts.mockServer.mock<Record<string, any>>(
			async (req) => {
				const body = await getJSONBody(req);

				expect(body).toEqual({
					query: {
						match: {
							title: {
								query: 'The Outsider',
							},
						},
					},
				});

				return true;
			},
			async (req) => {
				return {
					body: mockSearchResponse,
				};
			}
		);

		const result = await ts.testServer.client().query({
			operationName: 'simple',
		});

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data).toEqual(mockSearchResponse);
	});
});
