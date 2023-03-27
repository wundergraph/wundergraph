import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { ChatResponseData } from '../.wundergraph/generated/models';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('test chat subscription', () => {
	test('subscribeOnce', async () => {
		let data: ChatResponseData | undefined;
		const result = await wg.client().subscribe(
			{
				operationName: 'Chat',
				subscribeOnce: true,
			},
			(resp) => {
				expect(resp.error).toBeFalsy();
				data = resp.data;
			}
		);

		expect(result.error).toBeFalsy();
		expect(result?.data?.chat_messageAdded.id.length).toBeGreaterThan(0);
		expect(result.data?.chat_messageAdded.id).toBe(data?.chat_messageAdded.id);
		expect(result.data?.chat_messageAdded.text).toBe(data?.chat_messageAdded.text);
	});
});
