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

describe('The WunderGraph ORM', () => {
	it('should be able to be used from a TypeScript Operation', async () => {
		const client = wg.client();
		const { data, error } = await client.query({
			operationName: 'ts/orm',
		});
		expect(error).toBeUndefined();
		expect(data?.code).toEqual('DE');
	});

	it('should be able to be used from a webhook', async () => {
		const resp = await fetch(wg.url('/webhooks/country'), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: '{"country_code":"DE"}',
		});
		const data = await resp.json();
		expect(data.name).toBe('Germany');
	});

	it('it should pass a clientRequest to the internal GraphQL server', async () => {
		const client = wg.client();
		const headerValue = 'Bar';
		client.setExtraHeaders({ 'X-Foo': headerValue });
		// This needs to be run in a loop because we need to reuse a resolve.Context
		// to trigger the bug
		for (let ii = 0; ii < 100; ii++) {
			const { data, error } = await client.query({
				operationName: 'clientRequestHeader',
				input: {
					header: 'X-Foo',
				},
			});
			expect(error).toBeUndefined();
			expect(data?.forwarded).toBe(headerValue);
			expect(data?.overridden).toBe(`${headerValue}_override`);
			expect(data?.added).toBe(headerValue);
		}
	});

	it('it should pass a clientRequest to the internal GraphQL server via a GraphQL operation', async () => {
		const client = wg.client();
		const headerValue = 'Bar';
		client.setExtraHeaders({ 'X-Foo': headerValue });
		const { data, error } = await client.query({
			operationName: 'clientRequestHeaderViaGQL',
			input: {
				header: 'X-Foo',
			},
		});
		expect(error).toBeUndefined();
		expect(data?.forwarded).toBe(headerValue);
		expect(data?.overridden).toBe(`${headerValue}_override`);
		expect(data?.added).toBe(headerValue);
	});

	it('should add custom headers', async () => {
		const client = wg.client();
		const { data, error } = await client.query({
			operationName: 'ts/with-headers',
		});
		expect(error).toBeUndefined();
		expect(data).toEqual('test');
	});
});
