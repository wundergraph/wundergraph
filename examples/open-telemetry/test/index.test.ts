import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer();
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('Test Continents API', () => {
	test('continents', async () => {
		const result = await wg.client().query({
			operationName: 'Continents',
		});
		expect(result.data?.countries_continents.length).toBe(7);
	});
});
