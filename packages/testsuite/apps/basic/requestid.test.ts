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

describe('Request ID', () => {
	it('should retrieve the request ID in a TS operation', async () => {
		const client = wg.client();
		const requestId = '42';
		client.setExtraHeaders({ 'X-Request-ID': requestId });
		const { data, error } = await client.query({
			operationName: 'requestid/ts',
		});
		expect(error).toBeUndefined();
		expect(data).toBe(requestId);
	});

	it('should propagate the request ID from a TS operation to another one', async () => {
		const client = wg.client();
		const requestId = '43';
		client.setExtraHeaders({ 'X-Request-ID': requestId });
		const { data, error } = await client.query({
			operationName: 'requestid/fromTs',
		});
		expect(error).toBeUndefined();
		expect(data).toBe(requestId);
	});

	it('should propagate the request ID from a TS operation to GraphQL hooks', async () => {
		const client = wg.client();
		const requestId = '44';
		client.setExtraHeaders({ 'X-Request-ID': requestId });
		const { data, error } = await client.query({
			operationName: 'requestid/fromTsToGraphQL',
		});
		expect(error).toBeUndefined();
		expect(data?.requestId?.code).toBe(requestId);
	});
});
