import { beforeAll, describe, expect, it } from 'vitest';
import { createTestServer } from './.wundergraph/generated/testing';

const wg = createTestServer({
	dir: __dirname,
});

beforeAll(async () => {
	await wg.start();

	return async () => {
		await wg.stop();
	};
});

describe('Transform directive', () => {
	it('@transform in public operation', async () => {
		const result = await wg.client().query({
			operationName: 'CountryWeather',
			input: {
				countryCode: 'ES',
			},
		});
		expect(result.error).toBeUndefined();
		const country = result?.data?.country?.[0];
		expect(country).toBeDefined();
		expect(country?.capital).toBe('Madrid');
		expect(country?.weather.temperature?.max).toBeDefined();
	});

	it('@transform in internal operation', async () => {
		const result = await wg.client().query({
			operationName: 'functions/CountryWeatherViaInternal',
			input: {
				countryCode: 'ES',
			},
		});
		expect(result.error).toBeUndefined();
		const country = result?.data?.data?.country?.[0];
		expect(country).toBeDefined();
		expect(country?.capital).toBe('Madrid');
		expect(country?.weather.temperature?.max).toBeDefined();
	});
});
