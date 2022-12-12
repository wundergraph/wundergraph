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

describe('Test federation API', () => {
	test('top products', async () => {
		const result = await wg.client().query({
			operationName: 'TopProducts',
		});
		expect(result.data?.topProducts.length).toBe(3);
	});
});
