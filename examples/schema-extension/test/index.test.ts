import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('Test Users API', () => {
	test('users', async () => {
		const result = await wg.client().query({
			operationName: 'Users',
		});
		expect(result.error).toBeFalsy();
		expect(result.data?.db_findFirstusers?.name).toBe('Jens@WunderGraph');
	});
});
