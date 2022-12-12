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

describe('Test Users API', () => {
	test('users', async () => {
		const result = await wg.client().query({
			operationName: 'Users',
		});
		expect(result.data?.db_findFirstusers.name).toBe('Jens@WunderGraph');
	});
});
