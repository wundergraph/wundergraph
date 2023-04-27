import { describe, expect, it, onTestFailed } from 'vitest';
import { Setup } from '../../setup/generate';
import { createTestAndMockServer } from './.wundergraph/generated/testing';

// XXX: This test runs code generation, so we can't run multiple test files in parallel
const regenerate = async (env?: Record<string, string>) => {
	await Setup('apps/http-proxy', { env });
};

const invalidProxy = 'http://this.does.not.exist';

describe('Invalid proxy configurations', () => {
	it('uses valid proxy for introspection', async () => {
		const ts = createTestAndMockServer({
			dir: __dirname,
			env: { WG_HTTP_PROXY: invalidProxy },
		});
		const cleanup = await ts.start();
		onTestFailed(() => cleanup());

		await regenerate({
			WG_HTTP_PROXY: ts.mockServer.url(),
		});
		await cleanup();
	});

	it('uses an invalid global proxy for generation and fails', async () => {
		await expect(async () => regenerate({ WG_HTTP_PROXY: invalidProxy })).rejects.toThrow();
	});

	it('uses an invalid global proxy for queries and fails', async () => {
		await regenerate({});
		const ts = createTestAndMockServer({
			dir: __dirname,
		});
		const cleanup = await ts.start({
			env: { WG_HTTP_PROXY: invalidProxy },
		});
		onTestFailed(() => cleanup());

		const client = ts.testServer.client();
		const result = await client.query({
			operationName: 'CountryByCode',
			input: {
				code: 'ES',
			},
		});

		expect(result.error).toBeDefined();
		expect(result.data).toBeUndefined();

		await cleanup();
	});

	it('uses data source proxy to override invalid global proxy and generates', async () => {
		await regenerate({
			WG_HTTP_PROXY: invalidProxy,
			COUNTRIES_PROXY: '',
			WEATHER_PROXY: '',
		});
	});

	it('uses data source proxy to override invalid global proxy and runs queries', async () => {
		const ts = createTestAndMockServer({
			dir: __dirname,
			env: { WG_HTTP_PROXY: invalidProxy, COUNTRIES_PROXY: '', WEATHER_PROXY: '' },
		});
		const cleanup = await ts.start();
		onTestFailed(() => cleanup());

		const client = ts.testServer.client();
		const result = await client.query({
			operationName: 'CountryByCode',
			input: {
				code: 'ES',
			},
		});

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.countries_countries?.[0].capital).toBe('Madrid');

		await cleanup();
	});

	it('uses an invalid data source proxy for generation and fails', async () => {
		await expect(async () => regenerate({ COUNTRIES_PROXY: invalidProxy })).rejects.toThrow();
	});

	it('uses and invalid data source proxy for queries and fails', async () => {
		await regenerate();

		const ts = createTestAndMockServer({
			dir: __dirname,
			env: { COUNTRIES_PROXY: invalidProxy },
		});
		const cleanup = await ts.start();
		onTestFailed(() => cleanup());

		const client = ts.testServer.client();
		const result = await client.query({
			operationName: 'CountryByCode',
			input: {
				code: 'ES',
			},
		});

		expect(result.error).toBeDefined();
		expect(result.data).toBeUndefined();

		await cleanup();
	});

	it('uses valid proxy for queries', async () => {
		const ts = createTestAndMockServer({
			dir: __dirname,
		});
		const cleanup = await ts.start();
		onTestFailed(() => cleanup());

		const scope = ts.mockServer.assertHTTPConnect(async ({ url }) => {
			return url === 'countries.trevorblades.com:443';
		});

		const result = await ts.testServer.client().query({
			operationName: 'CountryByCode',
			input: {
				code: 'ES',
			},
		});

		scope.done();

		expect(result.error).toBeUndefined();
		expect(result.data).toBeDefined();
		expect(result.data?.countries_countries?.[0].capital).toBe('Madrid');

		await cleanup();
	});
});
