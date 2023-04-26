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

describe('Operations', () => {
	it('Should return a client request header from the embedded GraphQL server', async () => {
		/*
		 * This test ensure that a client request header is correctly passed to an embedded GraphQL server.
		 * The GraphQL Schema returns the value of the header as a string,
		 * so we can check if the header was correctly passed back to the client.
		 * */
		const client = wg.client();
		client.setExtraHeaders({
			'X-Test': 'test123',
		});
		const { data, error } = await client.query({
			operationName: 'clientrequest/Header',
			input: {
				header: 'X-Test',
			},
		});

		expect(error).toBeUndefined();
		expect(data?.embedded_clientRequestHeader).toBe('test123');
	});
});
