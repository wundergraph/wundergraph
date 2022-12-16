import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { ClientResponse } from '@wundergraph/sdk/client';
import { WsResponseData } from '../.wundergraph/generated/models';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });

beforeAll(async () => {
	await wg.start();
});

afterAll(async () => {
	await wg.stop();
});

describe('test ws subscription', () => {
	test('subscribeOnce', async () => {
		let data: WsResponseData | undefined;
		const result = (await wg.client().subscribe(
			{
				operationName: 'Ws',
				subscribeOnce: true,
			},
			(resp) => {
				expect(resp.error).toBeFalsy();
				data = resp.data;
			}
		)) as ClientResponse<WsResponseData>;

		expect(result.error).toBeFalsy();
		expect(result.data?.ws_greetings).toBe('Hi');
		expect(result.data?.ws_greetings).toBe(data?.ws_greetings);
	});
});
