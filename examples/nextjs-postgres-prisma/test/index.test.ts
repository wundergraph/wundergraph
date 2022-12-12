import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });

beforeAll(async () => {
	await wg.start();
});

afterAll(async () => {
	await wg.stop();
});

describe('Test User by email', () => {
	test('user by email', async () => {
		const result = await wg.client().query({
			operationName: 'UserByEmail',
			input: {
				email: 'jens@wundergraph.com',
			},
		});
		expect(result.data?.db_findFirstUser.name).toBe('Jens');
	});
});
