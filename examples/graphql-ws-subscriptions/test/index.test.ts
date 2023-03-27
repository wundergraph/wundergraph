import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('test ws subscription', () => {
	test('subscribeOnce', async () => {
		let data: WsResponseData | undefined;
		const result = await wg.client().subscribe(
			{
				operationName: 'Ws',
				subscribeOnce: true,
			},
			(resp) => {
				expect(resp.error).toBeFalsy();
				data = resp.data;
			}
		);

		expect(result.error).toBeFalsy();
		expect(result.data?.ws_greetings).toBe('Hi');
		expect(result.data?.ws_greetings).toBe(data?.ws_greetings);
	});
});
