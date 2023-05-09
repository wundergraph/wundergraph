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

describe('Schema Extensions', () => {
	it('Should call operation with optional extension field', async () => {
		const client = wg.client();

		const { data, error } = await client.query({
			operationName: 'schema-extensions/ExtensionWithoutHook',
		});

		expect(error).toBeUndefined();
		expect(data?.spacex_capsule?.id).toBeDefined();
		expect(data?.spacex_capsule?.myCustomField).toBeNull();
	});
	it('Should return optional extension field from mutatingPostResolve hook', async () => {
		const client = wg.client();

		const { data, error } = await client.query({
			operationName: 'schema-extensions/ExtensionWithHook',
		});

		expect(error).toBeUndefined();
		expect(data?.spacex_capsule?.id).toBeDefined();
		expect(data?.spacex_capsule?.myCustomField).toEqual('resolved by mutatingPostResolve hook');
	});
});
