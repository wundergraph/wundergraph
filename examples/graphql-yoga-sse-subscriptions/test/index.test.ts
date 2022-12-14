import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { ClientResponse } from '@wundergraph/sdk/client';
import { CounterResponseData } from '../.wundergraph/generated/models';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });

beforeAll(async () => {
	await wg.start();
});

afterAll(async () => {
	await wg.stop();
});

describe('test counter subscription', () => {
	test('subscribeOnce', async () => {
		let data: CounterResponseData | undefined;
		const result = (await wg.client().subscribe(
			{
				operationName: 'Counter',
				subscribeOnce: true,
			},
			(resp) => {
				expect(resp.error).toBeFalsy();
				data = resp.data;
			}
		)) as ClientResponse<CounterResponseData>;

		expect(result.error).toBeFalsy();
		expect(result.data?.counter_countdown).toBe(data?.counter_countdown);
	});
});
