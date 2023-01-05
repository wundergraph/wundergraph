import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('Test cross API joins', () => {
	test('country weather', async () => {
		const result = await wg.client().query({
			operationName: 'CountryWeather',
			input: {
				countryCode: 'ES',
			},
		});
		expect(result.data?.country?.[0].capital).toBe('Madrid');
	});
});
