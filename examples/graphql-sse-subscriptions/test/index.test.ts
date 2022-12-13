import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { ClientResponse } from '@wundergraph/sdk/client';
import { SseResponseData } from '../.wundergraph/generated/models';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });

beforeAll(async () => {
	await wg.start();
});

afterAll(async () => {
	await wg.stop();
});

describe('test chat subscription', () => {
	test('subscribeOnce', async () => {
		let data: SseResponseData | undefined;
		const result = (await wg.client().subscribe(
			{
				operationName: 'Chat',
				subscribeOnce: true,
			},
			(resp) => {
				expect(resp.error).toBeFalsy();
				data = resp.data;
			}
		)) as ClientResponse<SseResponseData>;

		expect(result.error).toBeFalsy();
		expect(result.data?.sse_greetings).toBe(data?.sse_greetings);
	});
});
