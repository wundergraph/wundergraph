import { beforeAll, describe, expect, it } from 'vitest';
import { createTestServer } from './.wundergraph/generated/testing';

const wg = createTestServer({
	dir: __dirname,
});

beforeAll(async () => {
	await wg.start();

	return async () => {
		await wg.stop();
	};
});

describe('Custom context', () => {
	it('should use custom context in TS operations', async () => {
		const client = wg.client();

		const { data, error } = await client.query({
			operationName: 'customcontext/query',
		});

		expect(error).toBeUndefined();
		expect(data?.hello).toBe('world');
	});
});
