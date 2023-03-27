import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer();

beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('functions', () => {
	test('internal operation call from function', async () => {
		const client = wg.client();

		const { data: notFoundData, error: notFoundError } = await client.query({
			operationName: 'users/throw',
			input: { throw: 'NotFound' },
		});

		expect(notFoundError?.code).toBe('NotFound');
		expect(notFoundError?.statusCode).toBe(404);

		const { data: badRequestData, error: badRequestError } = await client.query({
			operationName: 'users/throw',
			input: { throw: 'BadRequest' },
		});

		expect(badRequestError?.code).toBe('BadRequest');
		expect(badRequestError?.statusCode).toBe(400);
	});
});
