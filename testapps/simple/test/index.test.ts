import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer();

beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('functions', () => {
	test('Call users/throw typescript function', async () => {
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

	test('Call users/throw typescript function', async () => {
		const client = wg.client();

		const { data, error } = await client.query({
			operationName: 'users/simple',
		});

		expect(error).toBeUndefined();
		expect(data).toBe('hello simple');
	});

	test('Call Weather graphql operation', async () => {
		const client = wg.client();

		const { data, error } = await client.query({
			operationName: 'Weather',
			input: { forCity: 'Berlin' },
		});

		expect(error).toBeUndefined();
	});
});
