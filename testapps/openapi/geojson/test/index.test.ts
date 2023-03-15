import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('test Countries API', () => {
	test('geojson', async () => {
		const result = await wg.client().query({
			operationName: 'Location',
		});
		const pointCoordArrLength = result.data?.geojson?.features[0].geometry.coordinates[0][0][0].length;
		expect(pointCoordArrLength).toBe(2);
	});
});
