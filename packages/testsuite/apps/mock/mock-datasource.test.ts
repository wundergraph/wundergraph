import { expect, beforeEach, describe, it } from 'vitest';
import { createTestAndMockServer } from './.wundergraph/generated/testing';
import { getJSONBody } from '@wundergraph/sdk/testing';
import { TestContext } from './types';

beforeEach<TestContext>(async (ctx) => {
	const ts = createTestAndMockServer({
		// The directory where your wundergraph directory is located
		dir: __dirname,
	});

	ctx.ts = ts;

	return ts.start({
		// Environment variables replaced by the test mock server URL
		mockedAPIs: ['COUNTRIES_URL'],
	});
});

describe('Mock http datasource', () => {
	it<TestContext>('Should mock countries origin API', async ({ ts }) => {
		expect.assertions(5);

		// Mock the countries origin API
		ts.mockServer.mock(
			async (req) => {
				const body = await getJSONBody(req);

				expect(body.variables.code).toEqual('ES');
				expect(body.query).toEqual(
					'query($code: String){countries_countries: countries(filter: {code: {eq: $code}}){code name capital}}'
				);

				return true;
			},
			async (req) => {
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
			}
		);

		const result = await ts.testServer.client().query({
			operationName: 'CountryByCode',
			input: {
				code: 'ES',
			},
		});

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.countries_countries?.[0].capital).toBe('Madrid');
	});

	it<TestContext>('Should not be called because does not match', async ({ ts }) => {
		expect.assertions(2);

		ts.mockServer.mock(
			async (req) => {
				return false;
			},
			async (req) => {
				expect.fail('This should not be called');

				return {};
			}
		);

		const result = await ts.testServer.client().query({
			operationName: 'CountryByCode',
			input: {
				code: 'ES',
			},
		});

		expect(result.error).toBeDefined();
		expect(result.data).toBeUndefined();
	});
});
