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

describe('Operations', () => {
	it('Should call operation from operations generator', async () => {
		/*
		 * This operation is generated using the operations generator.
		 * By calling it from the client, we ensure that the operation is correctly generated.
		 * */
		const client = wg.client();
		const { data, error } = await client.query({
			operationName: 'weather/GetCityByName',
			input: {
				name: 'Berlin',
			},
		});

		expect(error).toBeUndefined();
		expect(data?.weather_getCityByName?.id).toBeDefined();
	});
});
