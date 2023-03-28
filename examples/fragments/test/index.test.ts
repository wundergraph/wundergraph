import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('Test Fragments', () => {
	test('local fragment', async () => {
		const result = await wg.client().query({
			operationName: 'LocalFragment',
		});
		expect(result.data?.spacex_dragons?.length).toBe(2);
	});
	test('global fragment', async () => {
		const result = await wg.client().query({
			operationName: 'GlobalFragment',
		});
		expect(result.data?.spacex_missions?.length).toBe(10);
	});
});
