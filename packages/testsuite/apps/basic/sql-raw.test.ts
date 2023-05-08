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

describe('SQL raw', () => {
	it('execute raw', async () => {
		const client = wg.client();
		const result = await client.mutate({
			operationName: 'rawsql/ExecuteRaw',
			input: {
				id: '2',
				name: 'Jannik',
				email: 'jannik@wundergraph.com',
			},
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.users_post_executeRaw).toBe(0);
	});

	it('execute raw inline', async () => {
		const client = wg.client();
		const result = await client.mutate({
			operationName: 'rawsql/ExecuteRawInline',
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.users_post_executeRaw).toBe(0);
	});

	it('query raw json', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'rawsql/QueryRawJSON',
		});
		expect(result.error).toBeUndefined();
		expect(JSON.stringify(result.data?.json)).toEqual(
			`[{"id":1,"email":"jens@wundergraph.com","name":"Jens"},{"id":2,"email":"jannik@wundergraph.com","name":"Jannik"}]`
		);
	});

	it('query raw row', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'rawsql/QueryRow',
			input: {
				email: 'jens@wundergraph.com',
			},
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.row[0].id).toEqual(1);
		expect(result.data?.row[0].name).toEqual('Jens');
		expect(result.data?.row[0].email).toEqual('jens@wundergraph.com');
	});

	it('query raw row inline', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'rawsql/QueryRowInline',
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.row[0].id).toEqual(2);
		expect(result.data?.row[0].name).toEqual('Jannik');
		expect(result.data?.row[0].email).toEqual('jannik@wundergraph.com');
	});
});
