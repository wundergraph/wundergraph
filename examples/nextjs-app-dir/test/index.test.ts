import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'cross-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('test Todos API', () => {
	test('allTodos', async () => {
		const result = await wg.client().query({
			operationName: 'allTodos',
		});
		const todos = result.data?.todos_todos;
		expect(todos?.length).toBe(1);
	});
});
