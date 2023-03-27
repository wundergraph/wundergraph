import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { WsResponseData } from '../.wundergraph/generated/models';
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
				input: {
					from: 5,
				},
			},
			(resp) => {
				expect(resp.error).toBeFalsy();
				data = resp.data;
			}
		);

		expect(result.error).toBeFalsy();
		expect(result.data?.ws_countdown).toBe(data?.ws_countdown);
		expect(result.data?.ws_countdown).toBe(8);
	});
});
