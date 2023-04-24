import { expect } from 'vitest';
import { createTestServer } from './.wundergraph/generated/testing';

export const expectQuerySuccess = async (env: Record<string, string>) => {
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

export const expectQueryFailure = async (env: Record<string, string>) => {
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
