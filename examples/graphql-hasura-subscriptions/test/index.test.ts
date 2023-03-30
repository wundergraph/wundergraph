import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';

import { ClientOperationErrors, ClientResponse } from '@wundergraph/sdk/client';

import { TodosSubscriptionResponseData } from '../.wundergraph/generated/models';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

// Only run tests if we have a valid token
const testIfToken = !!process.env.HASURA_BEARER_TOKEN ? test : test.skip;

describe('test hasura subscriptions', () => {
	testIfToken('todos subscribe once', async () => {
		const result = (await wg.client().subscribe(
			{
				operationName: 'TodosSubscription',
				subscribeOnce: true,
			},
			() => {}
		)) as ClientResponse<TodosSubscriptionResponseData | undefined, ClientOperationErrors | undefined>;

		expect(result.error).toBeUndefined();
		expect(result.data?.hasura_todos.length ?? 0 > 0).toBeTruthy();
	});

	testIfToken('todos subscribe and cancel', async () => {
		const abortController = new AbortController();
		const customFetch = (req: RequestInfo | URL) => fetch(req, { signal: abortController.signal });
		const server = createTestServer({ fetch: customFetch });
		await server.start();
		let receivedData = false;
		try {
			await server.client().subscribe(
				{
					operationName: 'TodosSubscription',
				},
				(resp) => {
					expect(resp.error).toBeUndefined();
					expect(resp.data).toBeDefined();
					expect(resp.data?.hasura_todos.length ?? 0 > 0).toBeTruthy();
					expect(resp.data?.hasura_todos?.[0].title).toBeTruthy();
					receivedData = true;
					abortController.abort();
				}
			);
		} catch {
		} finally {
			await server.stop();
		}

		expect(receivedData).toBeTruthy();
	});

	testIfToken('todos query', async () => {
		const result = await wg.client().query({
			operationName: 'TodosQuery',
			input: {
				limit: 10,
			},
		});

		expect(result.error).toBeUndefined();
		expect(result.data?.hasura_todos.length).toBe(10);
	});
});
