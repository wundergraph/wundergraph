import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('test Countries API', () => {
	test('countries', async () => {
		const result = await wg.client().query({
			operationName: 'Countries',
		});
		const countries = result.data?.countries_countries;
		expect(countries?.length).toBe(250);
	});

	test('continents', async () => {
		const result = await wg.client().query({
			operationName: 'Continents',
		});
		expect(result.data?.countries_continents.length).toBe(7);
	});
});
