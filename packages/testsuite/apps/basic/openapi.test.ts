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

describe('OpenAPI GeoJSON API', () => {
	it('geojson', async () => {
		const result = await wg.client().query({
			operationName: 'openapi/Location',
		});
		const pointCoordArrLength = result.data?.geojson?.features[0].geometry.coordinates[0][0][0].length;
		expect(pointCoordArrLength).toBe(2);
	});
});
