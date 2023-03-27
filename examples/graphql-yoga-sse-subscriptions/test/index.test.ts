import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { CounterResponseData } from '../.wundergraph/generated/models';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('test counter subscription', () => {
	test('subscribeOnce', async () => {
		let data: CounterResponseData | undefined;
		const result = await wg.client().subscribe(
			{
				operationName: 'Counter',
				subscribeOnce: true,
			},
			(resp) => {
				expect(resp.error).toBeFalsy();
				data = resp.data;
			}
		);

		expect(result.error).toBeFalsy();
		expect(result.data?.counter_countdown).toBe(data?.counter_countdown);
	});
});
