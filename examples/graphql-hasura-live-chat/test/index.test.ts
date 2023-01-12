import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('Test hasura API', () => {
	test('Fetch All Messages', async () => {
		const userResponse = await wg.client().mutate({
			operationName: 'AddUser',
			input: {
				username: 'testuser',
			},
		});
		expect(userResponse.data.hasura_insert_user_one.username).toBe('testuser');

		const insertMsqResponse = await wg.client().mutate({
			operationName: 'InsertMessage',
			input: {
				message: {
					id: 1,
					text: 'hello',
					timestamp: '2021-01-01T00:00:00Z',
					username: userResponse.data.hasura_insert_user_one.username,
				},
			},
		});
		expect(insertMsqResponse.data.hasura_insert_message_one.text).toBe('hello');

		const msgs = await wg.client().query({
			operationName: 'FetchAllMessages',
		});
		expect(msgs.data?.hasura_message.length).toBe(1);
		expect(msgs.data?.hasura_message[0].username).toBe(userResponse.data.hasura_insert_user_one.username);
		expect(msgs.data?.hasura_message[0].text).toBe(insertMsqResponse.data.hasura_insert_message_one.text);
	});
});
