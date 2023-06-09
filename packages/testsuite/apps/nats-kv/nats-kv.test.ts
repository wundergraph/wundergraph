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

describe('The Nats KV', () => {
	it('should allow me to create a key in the bucket and read it back', async () => {
		const client = wg.client();
		const created = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'mykey',
				value: {
					token: 'mytoken',
				},
			},
		});
		expect(created.error).toBeUndefined();
		expect(created.data).toBeDefined();
		expect(created.data?.kv_put?.key).toBe('mykey');
		expect(created.data?.kv_put?.value.token).toBe('mytoken');

		const read = await client.query({
			operationName: 'gql_get',
			input: {
				key: 'mykey',
			},
		});
		expect(read.error).toBeUndefined();
		expect(read.data).toBeDefined();
		expect(read.data?.kv_get?.key).toBe('mykey');

		const deleted = await client.mutate({
			operationName: 'gql_delete',
			input: {
				key: 'mykey',
			},
		});
		expect(deleted.error).toBeUndefined();
		expect(deleted.data).toBeDefined();
		expect(deleted.data?.kv_delete).toBe(true);

		const deletedAgain = await client.mutate({
			operationName: 'gql_delete',
			input: {
				key: 'mykey',
			},
		});
		expect(deletedAgain.error).toBeUndefined();
		expect(deletedAgain.data).toBeDefined();
		expect(deletedAgain.data?.kv_delete).toBe(true);

		const readAgain = await client.query({
			operationName: 'gql_get',
			input: {
				key: 'mykey',
			},
		});
		expect(readAgain.error).toBeUndefined();
		expect(readAgain.data).toBeDefined();
		expect(readAgain.data?.kv_get).toBeNull();
	});
});
