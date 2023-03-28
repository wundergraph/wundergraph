import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';

import { ClientOperationErrors, ClientResponse } from '@wundergraph/sdk/client';

import { TodoResponseData } from '../.wundergraph/generated/models';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('test hasura subscriptions', () => {
	test('todo', async () => {
		if (!process.env.HASURA_BEARER_TOKEN) {
			// Skip
			return;
		}
		const result = (await wg.client().subscribe(
			{
				operationName: 'Todo',
				subscribeOnce: true,
			},
			() => {}
		)) as ClientResponse<TodoResponseData | undefined, ClientOperationErrors | undefined>;

		expect(result.error).toBeUndefined();
		expect(result.data?.hasura_todos.length ?? 0 > 0).toBeTruthy();
		console.log(result);
	});
});
