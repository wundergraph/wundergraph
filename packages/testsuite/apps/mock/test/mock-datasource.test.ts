import { expect, describe, it, beforeAll } from 'vitest';
import { join } from 'path';
import { createTestAndMockServer } from '../.wundergraph/generated/testing';
import type { TestServers } from '../.wundergraph/generated/testing';

let ts: TestServers;

beforeAll(async () => {
	ts = createTestAndMockServer({
		// The directory where your wundergraph directory is located
		dir: join(__dirname, '..'),
	});

	return ts.start({
		// Environment variables replaced by the test mock server URL
		mockURLEnvs: ['COUNTRIES_URL', 'OS_NODE_URL'],
	});
});

describe('Mock http datasource', () => {
	it('Should mock countries origin API', async () => {
		// Mock the countries origin API
		const scope = ts.mockServer.mock({
			match: ({ url, method }) => {
				return url.path === '/' && method === 'POST';
			},
			handler: async ({ json }) => {
				const body = await json();
				expect(body.variables.code).toEqual('ES');
				expect(body.query).toEqual(
					'query($code: String){countries_countries: countries(filter: {code: {eq: $code}}){code name capital}}'
				);

				return {
					status: 200,
					headers: {
						'X-Foo': 'Bar',
					},
					body: {
						data: {
							countries_countries: [
								{
									code: 'ES',
									name: 'Spain',
									capital: 'Madrid',
								},
							],
						},
					},
				};
			},
		});

		const result = await ts.testServer.client().query({
			operationName: 'CountryByCode',
			input: {
				code: 'ES',
			},
		});

		scope.done();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.countries_countries?.[0].capital).toBe('Madrid');
	});

	it('Should not be called because does not match', async () => {
		const scope = ts.mockServer.mock({
			match: ({ url }) => {
				throw new Error(`Unexpected call to ${url}`);
			},
			handler: (req) => {
				expect.fail('This should not be called');

				return {};
			},
		});

		const result = await ts.testServer.client().query({
			operationName: 'CountryByCode',
			input: {
				code: 'ES',
			},
		});

		expect(scope.error).toBeDefined();
		expect(scope.isDone).toBe(false);
		expect(result.error).toBeDefined();
		expect(result.data).toBeUndefined();
	});
});
