import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer();

beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('functions', () => {
	test('internal operation call from function', async () => {
		const client = wg.client();

		const { data, error } = await client.query({
			operationName: 'users/throw',
			input: { throw: 'NotFound' },
		});

		if (error?.code == 'NotFound') {
			console.log('Not Found');
		}

		expect(error?.code).toBe('NotFound');
		expect(error?.statusCode).toBe(404);
	});
});
