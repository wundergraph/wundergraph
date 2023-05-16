import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('test Countries API', () => {
	test('countries', async () => {
		const result = await wg.client().query({
			operationName: 'country',
			input: {
				code: 'DE',
			},
		});
		const code = result.data?.germany.code;
		expect(code).toBe('DE');
	});
});
