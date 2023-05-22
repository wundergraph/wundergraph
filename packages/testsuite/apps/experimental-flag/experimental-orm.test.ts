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

describe('Server without experimental orm flag', () => {
	it('should return error when calling operation that uses the graph orm', async () => {
		const client = wg.client();

		const { data, error } = await client.query({
			operationName: 'ts/orm',
		});
		expect(data).toBe(undefined);
	});

	// it('should return error when calling webhook that uses the graph orm', async () => {
	// 	let error = ''
	// 	expect(error).toBe("Graph is not defined");

	// });
});
