import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Straightforward } from 'straightforward';
import { Setup } from '../../setup/generate';
import { expectQueryFailure, expectQuerySuccess } from './queries';

// XXX: This test runs code generation, so we can't run multiple test files in parallel

const regenerate = async (env: Record<string, string>) => {
	await Setup('apps/generation', { env });
};

const proxyFromEnvironment = process.env.HTTP_PROXY;
const localProxyPort = 3138;
const localProxy = `http://127.0.0.1:${localProxyPort}`;
const sf = new Straightforward();

beforeAll(async () => {
	if (!proxyFromEnvironment) {
		await sf.listen(localProxyPort);
	}
});

afterAll(() => {
	if (!proxyFromEnvironment) {
		sf.close();
	}
});

// Invalid proxy used to make generation fail
const invalidProxy = 'http://this.does.not.exist';
const validProxy = proxyFromEnvironment || localProxy;

const itIfValidProxy = !!validProxy ? it : it.skip;

describe(
	'Proxy configurations',
	() => {
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
	},
	{
		timeout: 30000,
	}
);
