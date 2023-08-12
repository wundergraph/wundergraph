import { expect, beforeAll, describe, it } from 'vitest';
import { join } from 'path';
import { TestServers, createTestAndMockServer } from '../.wundergraph/generated/testing';
import { TestContext } from '../types';

let ts: TestServers;

beforeAll(async (ctx) => {
	ts = createTestAndMockServer({
		// The directory where your wundergraph directory is located
		dir: join(__dirname, '..'),
		// Enable debug mode to see the real API request
		// This simplifies mock creation
		// debug: true,
	});

	return ts.start({
		// Environment variables replaced by the test mock server URL
		mockURLEnvs: [
			// dynamic environment variable
			'OS_NODE_URL',
			// datasource environment variables
			'WEATHER_URL',
			'COUNTRIES_URL',
		],
	});
});

describe('Mock Api join', () => {
	it<TestContext>('Should be able to mock the country and weather join', async () => {
		/**
		 * The order is important for a join.
		 * We join from the country to the weather API with the capital.
		 */
		const scopeCountry = ts.mockServer.mock<Record<string, any>>({
			match: async ({ json }) => {
				const body = await json();
				expect(body.variables.countryCode).toEqual('DE');
				return true;
			},
			handler: async ({}) => {
				return {
					body: { data: { country: [{ code: 'DE', name: 'Germany', capital: 'Berlin' }] } },
				};
			},
		});

		const scopeWeather = ts.mockServer.mock<Record<string, any>>({
			match: async ({ json }) => {
				const body = await json();
				expect(body.variables.capital).toEqual('Berlin');
				return true;
			},
			handler: async ({ json }) => {
				return {
					body: {
						data: {
							weather_getCityByName: {
								weather: { temperature: { max: 297.13 }, summary: { title: 'Clear', description: 'clear sky' } },
							},
						},
					},
				};
			},
		});

		const result = await ts.testServer.client().query({
			operationName: 'CountryWeather',
			input: {
				countryCode: 'DE',
			},
		});

		scopeWeather.done();
		scopeCountry.done();

		expect(result.error).toBeUndefined();
		expect(result.data).toStrictEqual({
			country: [
				{
					code: 'DE',
					name: 'Germany',
					capital: 'Berlin',
					weather: {
						temperature: {
							max: 297.13,
						},
						summary: {
							title: 'Clear',
							description: 'clear sky',
						},
					},
				},
			],
		});
	});
});
