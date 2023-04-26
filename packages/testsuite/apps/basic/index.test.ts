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
	it('Should be able to call Weather operation', async () => {
		const client = wg.client();

		const { data, error } = await client.query({
			operationName: 'Weather',
			input: {
				forCity: 'Berlin',
			},
		});

		expect(error).toBeUndefined();
		expect(data?.getCityByName).toBeDefined();
	});

	it('Should be able to call TypeScript operation', async () => {
		const client = wg.client();

		const { data, error } = await client.query({
			operationName: 'functions/simple',
		});

		expect(error).toBeUndefined();
		expect(data).toMatchInlineSnapshot('"hello simple"');
	});

	it('Should respond with correct error', async () => {
		const client = wg.client();

		const { data: notFoundData, error: notFoundError } = await client.query({
			operationName: 'functions/throw',
			input: { throw: 'NotFound' },
		});

		expect(notFoundError?.code).toBe('NotFound');
		expect(notFoundError?.statusCode).toBe(404);

		const { data: badRequestData, error: badRequestError } = await client.query({
			operationName: 'functions/throw',
			input: { throw: 'BadRequest' },
		});

		expect(badRequestError?.code).toBe('BadRequest');
		expect(badRequestError?.statusCode).toBe(400);
	});

	it('Function to function call with input vars', async () => {
		const client = wg.client();

		const result = await client.query({
			operationName: 'functions/user',
		});

		expect(result.error).toBeUndefined();
		expect(result.data.greeting).toBeDefined();
	});

	it('should allow operation names with hyphens', async () => {
		const result = await wg.client().query({
			operationName: 'with-hyphen/country-code-with-hyphen',
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.countries_countries?.[0].capital).toBe('Berlin');
	});

	it('should allow calling operation names with hyphens', async () => {
		const result = await wg.client().query({
			operationName: 'with-hyphen/call-country-code-with-hyphen-from-ts',
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.data?.countries_countries?.[0].capital).toBe('Berlin');
	});
});
