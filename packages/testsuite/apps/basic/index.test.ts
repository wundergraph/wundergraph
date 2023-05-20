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
		expect(result.data?.greeting).toBeDefined();
	});

	it('Should run mutations inside ts operations', async () => {
		/*
		 * This test ensure that a client request header is correctly passed to an embedded GraphQL server.
		 * The GraphQL Schema returns the value of the header as a string,
		 * so we can check if the header was correctly passed back to the client.
		 * */
		const client = wg.client();

		const { data, error } = await client.query({
			operationName: 'functions/mutation',
			input: {
				name: 'Test',
			},
		});

		expect(error).toBeUndefined();
		expect(data?.embedded_setName).toBe('Test');
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

	it('should allow using operations starting and ending in underscore', async () => {
		const result = await wg.client().query({
			operationName: '__underscores__/__more_underscores__',
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.countries_countries?.[0].capital).toBe('Madrid');
	});

	it('should allow using operations with numbers in the middle', async () => {
		const result = await wg.client().query({
			operationName: '__underscores__/42_as_a_string',
		});
		expect(result.error).toBeUndefined();
		expect(result.data).toBe('42');
	});

	it('should allow returning falsy data from a TS operation', async () => {
		const client = wg.client();

		const stringResult = await client.query({ operationName: 'falsy/string' });
		expect(stringResult.error).toBeUndefined();
		expect(stringResult.data).toBe('');

		const numberResult = await client.query({ operationName: 'falsy/number' });
		expect(numberResult.error).toBeUndefined();
		expect(numberResult.data).toBe(0);

		const booleanResult = await client.query({ operationName: 'falsy/boolean' });
		expect(booleanResult.error).toBeUndefined();
		expect(booleanResult.data).toBe(false);
	});
});
