import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { TestResponseData } from '../.wundergraph/generated/models';
import { createTestAndMockServer } from '../.wundergraph/generated/testing';

const wg = createTestAndMockServer();
beforeAll(async () => wg.start({ timeout: 2000 }), 20000);
afterAll(() => wg.stop());

describe('smart', () => {
	test('should work', async () => {
		const mockResponse: TestResponseData = {
			add: 2,
		};

		const result = await wg.testServer.client().query({
			operationName: 'test',
			input: {
				a: 1,
				b: 1,
			},
		});

		expect(result.data).toEqual(mockResponse);
	});
});
