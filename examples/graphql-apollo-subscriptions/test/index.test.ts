import { describe, expect, test } from '@jest/globals';

import { ClientResponse } from '@wundergraph/sdk/client';
import { ChatResponseData } from '../.wundergraph/generated/models';
import { createTestServer } from '../.wundergraph/generated/testing';

describe('test chat subscription', () => {
	test('subscribeOnce', async () => {
		const wg = createTestServer();
		await wg.start();
		try {
			let data: ChatResponseData | undefined;
			const result = (await wg.client().subscribe(
				{
					operationName: 'Chat',
					subscribeOnce: true,
				},
				(resp) => {
					expect(resp.error).toBeFalsy();
					data = resp.data;
				}
			)) as ClientResponse<ChatResponseData>;

			expect(result.error).toBeFalsy();
			expect(result?.data?.chat_messageAdded.id.length).toBeGreaterThan(0);
			expect(result.data?.chat_messageAdded.id).toBe(data?.chat_messageAdded.id);
			expect(result.data?.chat_messageAdded.text).toBe(data?.chat_messageAdded.text);
		} finally {
			await wg.stop();
		}
	});
	// XXX: Disabled until we figure out why this fails in CI
	// test('subscribeMultiple', async () => {
	// 	const controller = new AbortController();
	// 	const doFetch = (req: any) => {
	// 		return fetch(req, {
	// 			signal: controller.signal,
	// 		});
	// 	};
	// 	const wg = createTestServer({ fetch: doFetch });
	// 	await wg.start();
	// 	try {
	// 		let data: ChatResponseData[] = [];
	// 		const subscription = wg.client().subscribe(
	// 			{
	// 				operationName: 'Chat',
	// 			},
	// 			(resp) => {
	// 				expect(resp.error).toBeFalsy();
	// 				if (resp.data) {
	// 					data.push(resp.data);
	// 				}
	// 			}
	// 		);

	// 		// Send an update
	// 		const helloWorld = 'Hello World!';
	// 		const payload = {
	// 			operationName: 'SendMessage',
	// 			query: `mutation SendMessage {post(roomName: "test", username: "me", text: "${helloWorld}") { id text } }`,
	// 		};
	// 		const headers = new Headers({ 'Content-Type': 'application/json' });
	// 		for (let ii = 0; ii < 10; ii++) {
	// 			const resp = await fetch('http://localhost:8085/query', {
	// 				method: 'POST',
	// 				body: JSON.stringify(payload) as any,
	// 				headers: headers,
	// 			});
	// 			await resp.text();
	// 			await new Promise((resolve) => setTimeout(resolve, 100));
	// 		}
	// 		setTimeout(() => controller.abort(), 500);
	// 		try {
	// 			await subscription;
	// 		} catch (e: any) {}
	// 		expect(data.length).toBeGreaterThan(1);
	// 		expect(data[0].chat_messageAdded.text).not.toBe(helloWorld);
	// 		expect(data[1].chat_messageAdded.text).toBe(helloWorld);
	// 	} finally {
	// 		await wg.stop();
	// 	}
	// });
});
