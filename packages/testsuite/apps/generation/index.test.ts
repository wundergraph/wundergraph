import http from 'http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Setup } from '../../setup/generate';
import { createTestServer } from './.wundergraph/generated/testing';

// XXX: This test runs code generation, so we can't run multiple test files in parallel

const regenerate = async () => {
	await Setup('apps/generation');
};

const expectQuerySuccess = async () => {
	const wg = createTestServer({
		dir: __dirname,
	});
	await wg.start();

	const client = wg.client();
	const result = await client.query({
		operationName: 'CountryByCode',
		input: {
			code: 'ES',
		},
	});

	console.log(result);

	expect(result.error).toBeUndefined();
	expect(result.data).toBeDefined();
	expect(result.data?.countries_countries?.[0].capital).toBe('Madrid');

	await wg.stop();
};

const expectQueryFailure = async () => {
	const wg = createTestServer({
		dir: __dirname,
	});
	await wg.start();

	const client = wg.client();
	const result = await client.query({
		operationName: 'CountryByCode',
		input: {
			code: 'ES',
		},
	});

	expect(result.error).toBeDefined();
	expect(result.data).toBeUndefined();

	await wg.stop();
};

// Invalid proxy used to make generation fail
const invalidProxy = 'http://this.does.not.exist';
const validProxy = '';

const itIfValidProxy = !!validProxy ? it : it.skip;

describe('Proxy configurations', () => {
	it('uses an invalid global proxy for generation and fails', async () => {
		process.env.WG_HTTP_PROXY = invalidProxy;
		await expect(regenerate).rejects.toThrow();
		delete process.env.WG_HTTP_PROXY;
	});

	it('uses an invalid global proxy for queries and fails', async () => {
		process.env.WG_HTTP_PROXY = invalidProxy;
		await expectQueryFailure();
		delete process.env.WG_HTTP_PROXY;
	});

	it('uses data source proxy to override invalid global proxy and generates', async () => {
		process.env.WG_HTTP_PROXY = invalidProxy;
		process.env.COUNTRIES_PROXY = '';
		process.env.WEATHER_PROXY = '';
		await regenerate();
		delete process.env.WG_HTTP_PROXY;
		delete process.env.COUNTRIES_PROXY;
		delete process.env.WEATHER_PROXY;
	});

	it('uses data source proxy to override invalid global proxy and runs queries', async () => {
		process.env.WG_HTTP_PROXY = invalidProxy;
		process.env.COUNTRIES_PROXY = '';
		process.env.WEATHER_PROXY = '';
		await expectQuerySuccess();
		delete process.env.WG_HTTP_PROXY;
		delete process.env.COUNTRIES_PROXY;
		delete process.env.WEATHER_PROXY;
	});

	it('uses an invalid data source proxy for generation and fails', async () => {
		process.env.COUNTRIES_PROXY = invalidProxy;
		await expect(regenerate).rejects.toThrow();
		delete process.env.COUNTRIES_PROXY;
	});

	it('uses and invalid data source proxy for queries and fails', async () => {
		process.env.COUNTRIES_PROXY = invalidProxy;
		await expectQueryFailure();
		delete process.env.COUNTRIES_PROXY;
	});

	itIfValidProxy('uses valid proxy for introspection', async () => {
		process.env.WG_HTTP_PROXY = validProxy;
		await regenerate();
		delete process.env.WG_HTTP_PROXY;
	});

	itIfValidProxy('uses valid proxy for queries', async () => {
		process.env.WG_HTTP_PROXY = validProxy;
		await expectQuerySuccess();
		delete process.env.WG_HTTP_PROXY;
	});
});
