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

	it('should use custom context in hooks', async () => {
		const client = wg.client();

		const { data, error } = await client.query({
			operationName: 'customcontext/graphql',
		});

		expect(error).toBeUndefined();
		expect(data).toBe({ embedded_fromCustomContext: 'fromHook: world' });
	});

	it('should use custom context in embedded GraphQL server', async () => {
		const client = wg.client();

		const { data, error } = await client.query({
			operationName: 'customcontext/embedded',
		});

		expect(error).toBeUndefined();
		expect(data?.embedded_fromCustomContext).toBe('world');
	});
});
