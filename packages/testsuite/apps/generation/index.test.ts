import execa from 'execa';
import command_exists from 'command-exists';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Setup } from '../../setup/generate';
import { createTestServer } from './.wundergraph/generated/testing';

// XXX: This test runs code generation, so we can't run multiple test files in parallel

const regenerate = async (env: Record<string, string>) => {
	await Setup('apps/generation', { env });
};

const expectQuerySuccess = async (env: Record<string, string>) => {
	const wg = createTestServer({
		dir: __dirname,
		env,
	});
	await wg.start();

	const client = wg.client();
	const result = await client.query({
		operationName: 'CountryByCode',
		input: {
			code: 'ES',
		},
	});

	expect(result.error).toBeUndefined();
	expect(result.data).toBeDefined();
	expect(result.data?.countries_countries?.[0].capital).toBe('Madrid');

	await wg.stop();
};

const expectQueryFailure = async (env: Record<string, string>) => {
	const wg = createTestServer({
		dir: __dirname,
		env,
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

const proxyFromEnvironment = process.env.HTTP_PROXY;
const proxyFromSquid = (() => {
	if (!proxyFromEnvironment && command_exists.sync('docker-compose')) {
		return 'http://127.0.0.1:3128';
	}
})();

beforeAll(async () => {
	if (proxyFromSquid) {
		await execa('docker-compose', ['up', '-d'], { cwd: 'apps/generation' });
	}
});

afterAll(async () => {
	if (proxyFromSquid) {
		await execa('docker-compose', ['down'], { cwd: 'apps/generation' });
	}
});

// Invalid proxy used to make generation fail
const invalidProxy = 'http://this.does.not.exist';
const validProxy = proxyFromEnvironment || proxyFromSquid;

const itIfValidProxy = !!validProxy ? it : it.skip;

describe('Proxy configurations', () => {
	it('uses an invalid global proxy for generation and fails', async () => {
		await expect(async () => regenerate({ WG_HTTP_PROXY: invalidProxy })).rejects.toThrow();
	});

	it('uses an invalid global proxy for queries and fails', async () => {
		await regenerate({});
		await expectQueryFailure({
			WG_HTTP_PROXY: invalidProxy,
		});
	});

	it('uses data source proxy to override invalid global proxy and generates', async () => {
		await regenerate({
			WG_HTTP_PROXY: invalidProxy,
			COUNTRIES_PROXY: '',
			WEATHER_PROXY: '',
		});
	});

	it('uses data source proxy to override invalid global proxy and runs queries', async () => {
		await expectQuerySuccess({
			WG_HTTP_PROXY: invalidProxy,
			COUNTRIES_PROXY: '',
			WEATHER_PROXY: '',
		});
	});

	it('uses an invalid data source proxy for generation and fails', async () => {
		await expect(async () => regenerate({ COUNTRIES_PROXY: invalidProxy })).rejects.toThrow();
	});

	it('uses and invalid data source proxy for queries and fails', async () => {
		await regenerate({});
		await expectQueryFailure({
			COUNTRIES_PROXY: invalidProxy,
		});
	});

	itIfValidProxy('uses valid proxy for introspection', async () => {
		await regenerate({
			WG_HTTP_PROXY: validProxy!,
		});
	});

	itIfValidProxy('uses valid proxy for queries', async () => {
		await expectQuerySuccess({
			WG_HTTP_PROXY: validProxy!,
		});
	});
});
