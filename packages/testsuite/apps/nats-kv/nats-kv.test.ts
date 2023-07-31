import { beforeEach, describe, expect, it } from 'vitest';
import { createTestServer } from './.wundergraph/generated/testing';
import type { Gql_watchResponse, Gql_watch_allResponse } from './.wundergraph/generated/models';
import path from 'path';
import fs from 'fs';

const wg = createTestServer({
	dir: __dirname,
});

beforeEach(async () => {
	const storage = path.join(__dirname, '.wundergraph', 'generated', 'nats-server');
	fs.rmSync(storage, { recursive: true, force: true });
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
				revision: 1,
			},
		});
		expect(revision.error).toBeUndefined();
		expect(revision.data?.kv_getRevision?.key).toBe('mykey');
		expect(revision.data?.kv_getRevision?.value?.token).toBe('mytoken1');

		const update = await client.mutate({
			operationName: 'gql_update',
			input: {
				key: 'mykey',
				revision: 2,
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
		expect(history.data?.kv_history?.length).toBe(3);
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
		expect(keys.data?.kv_keys?.length).toBe(1);

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

	it('should watch a single key', async () => {
		const client = wg.client();
		const abortController = new AbortController();
		const responses: Gql_watchResponse[] = [];
		const put = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'mykey',
				value: {
					token: 'token1',
				},
			},
		});
		const sub = client.subscribe(
			{
				operationName: 'gql_watch',
				input: {
					keys: ['mykey'],
				},
				abortSignal: abortController.signal,
			},
			(res) => {
				responses.push(res);
			}
		);
		const put2 = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'mykey',
				value: {
					token: 'token2',
				},
			},
		});
		const put3 = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'mykey',
				value: {
					token: 'token3',
				},
			},
		});
		await new Promise((resolve) => setTimeout(resolve, 1000));
		abortController.abort();
		await sub;
		expect(responses.length).toBe(3);
		expect(responses[0].data?.kv_watch?.key).toBe('mykey');
		expect(responses[0].data?.kv_watch?.value?.token).toBe('token1');
		expect(responses[1].data?.kv_watch?.key).toBe('mykey');
		expect(responses[1].data?.kv_watch?.value?.token).toBe('token2');
		expect(responses[2].data?.kv_watch?.key).toBe('mykey');
		expect(responses[2].data?.kv_watch?.value?.token).toBe('token3');
	});

	it('should watch multiple keys', async () => {
		const client = wg.client();
		const abortController = new AbortController();
		const responses: Gql_watchResponse[] = [];
		const put = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'a',
				value: {
					token: 'a1',
				},
			},
		});
		const sub = client.subscribe(
			{
				operationName: 'gql_watch',
				input: {
					keys: ['a', 'b'],
				},
				abortSignal: abortController.signal,
			},
			(res) => {
				responses.push(res);
			}
		);
		const put2 = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'b',
				value: {
					token: 'b1',
				},
			},
		});
		const put3 = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'a',
				value: {
					token: 'a2',
				},
			},
		});
		const put4 = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'b',
				value: {
					token: 'b2',
				},
			},
		});
		await new Promise((resolve) => setTimeout(resolve, 1000));
		abortController.abort();
		await sub;
		expect(responses.length).toBe(4);
		expect(responses[0].data?.kv_watch?.key).toBe('a');
		expect(responses[0].data?.kv_watch?.value?.token).toBe('a1');
		expect(responses[1].data?.kv_watch?.key).toBe('b');
		expect(responses[1].data?.kv_watch?.value?.token).toBe('b1');
		expect(responses[2].data?.kv_watch?.key).toBe('a');
		expect(responses[2].data?.kv_watch?.value?.token).toBe('a2');
		expect(responses[3].data?.kv_watch?.key).toBe('b');
		expect(responses[3].data?.kv_watch?.value?.token).toBe('b2');
	});

	it('should watch all keys', async () => {
		const client = wg.client();
		const abortController = new AbortController();
		const responses: Gql_watch_allResponse[] = [];
		const put = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'a',
				value: {
					token: 'a1',
				},
			},
		});
		const put2 = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'b',
				value: {
					token: 'b1',
				},
			},
		});
		const sub = client.subscribe(
			{
				operationName: 'gql_watch_all',
				abortSignal: abortController.signal,
			},
			(res) => {
				responses.push(res);
			}
		);
		const put3 = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'a',
				value: {
					token: 'a2',
				},
			},
		});
		const put4 = await client.mutate({
			operationName: 'gql_put',
			input: {
				key: 'b',
				value: {
					token: 'b2',
				},
			},
		});
		await new Promise((resolve) => setTimeout(resolve, 1000));
		abortController.abort();
		await sub;
		expect(responses.length).toBe(4);
		expect(responses[0].data?.kv_watchAll?.key).toBe('a');
		expect(responses[0].data?.kv_watchAll?.value?.token).toBe('a1');
		expect(responses[1].data?.kv_watchAll?.key).toBe('b');
		expect(responses[1].data?.kv_watchAll?.value?.token).toBe('b1');
		expect(responses[2].data?.kv_watchAll?.key).toBe('a');
		expect(responses[2].data?.kv_watchAll?.value?.token).toBe('a2');
		expect(responses[3].data?.kv_watchAll?.key).toBe('b');
		expect(responses[3].data?.kv_watchAll?.value?.token).toBe('b2');
	});
});
