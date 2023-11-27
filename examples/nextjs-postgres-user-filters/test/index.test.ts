import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('Test User and Nodes', () => {
	test('create user and query user by email', async () => {
		const out = await wg.client().mutate({
			operationName: 'CreateUser',
			input: {
				data: {
					name: 'Jens',
					email: 'jens@wundergraph.com',
					Filter: {
						create: {
							node_created_after: new Date(2020, 0, 2).toISOString(),
						},
					},
				},
			},
		});
		expect(out.error).toBeFalsy();
		const result = await wg.client().query({
			operationName: 'UserByEmail',
			input: {
				email: 'jens@wundergraph.com',
			},
		});
		expect(result.error).toBeFalsy();
		expect(result.data?.db_findFirstUser?.name).toBe('Jens');
	});
	test('create nodes and query nodes', async () => {
		const nodes = await wg.client().mutate({
			operationName: 'CreateNode',
			input: {
				data: [
					{
						name: 'E',
						created_at: new Date(2020, 1, 1).toISOString(),
					},
					{
						name: 'F',
						created_at: new Date(2020, 1, 2).toISOString(),
					},
					{
						name: 'G',
						created_at: new Date(2020, 1, 3).toISOString(),
					},
					{
						name: 'H',
						created_at: new Date(2020, 1, 4).toISOString(),
					},
				],
			},
		});
		expect(nodes.error).toBeFalsy();
		const result = await wg.client().query({
			operationName: 'UserNodes',
			input: {
				where: {
					name: {
						equals: 'E',
					},
				},
			},
		});
		expect(result.error).toBeFalsy();
		expect(result.data?.db_findManyNode?.[0]?.created_at).toBe(new Date(2020, 1, 1).toISOString());
	});
});
