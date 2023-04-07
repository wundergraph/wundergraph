import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('Test Dragons API', () => {
	test('dragons', async () => {
		const result = await wg.client().query({
			operationName: 'Dragons',
		});
		expect(result.error).toBeFalsy();
		expect(result.data?.spacex_dragons?.length).toBe(2);
	});
});
