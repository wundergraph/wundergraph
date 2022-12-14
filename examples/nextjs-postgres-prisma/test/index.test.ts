import { afterAll, beforeAll, describe, expect, jest, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });

beforeAll(async () => {
	process.env['WUNDERGRAPH_CSRF_TOKEN_SECRET'] = 'abcdefghijk';
	process.env['WUNDERGRAPH_SECURE_COOKIE_HASH_KEY'] = 'a'.repeat(32);
	process.env['WUNDERGRAPH_SECURE_COOKIE_BLOCK_KEY'] = 'a'.repeat(32);
	await wg.start();
});

afterAll(async () => {
	await wg.stop();
});

describe('Test User APIs', () => {
	test('create user and query user by email', async () => {
		const out = await wg.client().mutate({
			operationName: 'CreateUser',
			input: {
				name: 'Jens',
				bio: 'Founder@WunderGraph',
				email: 'jens@wundergraph.com',
				title: 'Welcome to WunderGraph!',
				content: 'This is WunderGraph =)',
				published: true,
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
});
