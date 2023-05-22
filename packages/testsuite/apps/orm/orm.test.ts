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

describe('The WunderGraph ORM', () => {
	it('should be able to be used from a TypeScript Operation', async () => {
		const client = wg.client();
		const { data, error } = await client.query({
			operationName: 'ts/orm',
		});
		expect(error).toBeUndefined();
		expect(data?.code).toEqual('DE');
	});
});
