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
			operationName: 'gql_create',
			input: {
				key: 'mykey',
				value: {
					token: 'mytoken',
				},
			},
		});
		expect(created.error).toBeUndefined();
		expect(created.data).toBeDefined();
		expect(created.data?.kv_create?.key).toBe('mykey');
		expect(created.data?.kv_create?.value?.token).toBe('mytoken');

		const put = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'mykey',
				value: {
					token: 'mytoken2',
				},
			},
		});
		expect(put.error).toBeUndefined();
		expect(put.data?.kv_put?.revision).toBe(2);

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

		// delete only removes latest revisions. So we check if the first revision exists
		const revision = await client.query({
			operationName: 'gql_getRevision',
			input: {
				key: 'mykey',
				revision: 1,
			},
		});
		expect(revision.error).toBeUndefined();
		expect(revision.data?.kv_getRevision?.key).toBe('mykey');
		expect(revision.data?.kv_getRevision?.value?.token).toBe('mytoken');
	});

	it('should create, update, get revision and history', async () => {
		const client = wg.client();
		const created = await client.mutate({
			operationName: 'gql_create',
			input: {
				key: 'mykey',
				value: {
					token: 'mytoken1',
				},
			},
		});
		expect(created.error).toBeUndefined();
		expect(created.data?.kv_create?.key).toBe('mykey');
		expect(created.data?.kv_create?.value?.token).toBe('mytoken1');

		const put = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'mykey',
				value: {
					token: 'mytoken2',
				},
			},
		});
		expect(put.error).toBeUndefined();
		expect(put.data?.kv_put?.key).toBe('mykey');
		expect(put.data?.kv_put?.value?.token).toBe('mytoken2');

		const revision = await client.query({
			operationName: 'gql_getRevision',
			input: {
				key: 'mykey',
				revision: 5,
			},
		});
		expect(revision.error).toBeUndefined();
		expect(revision.data?.kv_getRevision?.key).toBe('mykey');
		expect(revision.data?.kv_getRevision?.value?.token).toBe('mytoken1');

		const update = await client.mutate({
			operationName: 'gql_update',
			input: {
				key: 'mykey',
				revision: 6,
				value: {
					token: 'mytoken3',
				},
			},
		});
		expect(update.error).toBeUndefined();
		expect(update.data?.kv_update?.key).toBe('mykey');
		expect(update.data?.kv_update?.value?.token).toBe('mytoken3');

		const history = await client.query({
			operationName: 'gql_history',
			input: {
				key: 'mykey',
			},
		});
		expect(history.error).toBeUndefined();
		expect(history.data?.kv_history?.length).toBe(7);
	});

	it('should get keys and purge', async () => {
		const client = wg.client();

		const created = await client.mutate({
			operationName: 'gql_create',
			input: {
				key: 'anotherKey',
				value: {
					token: 'mytoken',
				},
			},
		});
		expect(created.error).toBeUndefined();

		const keys = await client.query({
			operationName: 'gql_keys',
		});
		expect(keys.error).toBeUndefined();
		expect(keys.data?.kv_keys?.length).toBe(2);

		const purge = await client.mutate({
			operationName: 'gql_purge',
			input: {
				key: 'mykey',
			},
		});
		expect(purge.error).toBeUndefined();
		expect(purge.data).toBeDefined();
		expect(purge.data?.kv_purge).toBe(true);

		// purge removes all revisions so the first revision should not exist
		const revision = await client.query({
			operationName: 'gql_getRevision',
			input: {
				key: 'mykey',
				revision: 1,
			},
		});
		expect(revision.error).toBeUndefined();
		expect(revision.data?.kv_getRevision?.key).toBeUndefined();
	});
});
