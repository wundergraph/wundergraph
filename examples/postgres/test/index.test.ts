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

describe('Test users and messages API', () => {
	test('users', async () => {
		const result = await wg.client().query({
			operationName: 'Users',
		});
		expect(result.error).toBeFalsy();
		expect(result.data?.db_findFirstusers?.name).toBe('Jens@WunderGraph');
	});
	test('messages', async () => {
		const result = await wg.client().query({
			operationName: 'Messages',
		});
		expect(result.error).toBeFalsy();
		expect(result.data?.db_findManymessages.length).toBe(3);
	});
});
