import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { SseResponseData } from '../.wundergraph/generated/models';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('test sse subscription', () => {
	test('subscribeOnce', async () => {
		let data: SseResponseData | undefined;
		const result = await wg.client().subscribe(
			{
				operationName: 'Sse',
				subscribeOnce: true,
			},
			(resp) => {
				expect(resp.error).toBeFalsy();
				data = resp.data;
			}
		);
		expect(result?.error).toBeFalsy();
		expect(result?.data?.sse_greetings).toBe(data?.sse_greetings);
	});
});
