import { beforeAll, describe, expect, it } from 'vitest';
import { createTestServer } from './.wundergraph/generated/testing';
import { InputValidationError } from '@wundergraph/sdk/client';

const wg = createTestServer({
	dir: __dirname,
});

beforeAll(async () => {
	await wg.start();

	return async () => {
		await wg.stop();
	};
});

describe('jsonSchema directive', () => {
	it('it returns one result when looking up by matching query', async () => {
		const client = wg.client();
		const withCode = await client.query({
			operationName: 'CountryByFilter',
			input: {
				filter: {
					code: {
						eq: 'ES',
					},
				},
			},
		});

		// Lookup country by code, should return one result
		expect(withCode.error).toBeUndefined();
		expect(withCode.data?.countries_countries?.length).toBe(1);
		expect(withCode.data?.countries_countries[0].code).toBe('ES');
	});

	it('it returns no results when looking up by empty query', async () => {
		const client = wg.client();
		const withoutCode = await client.query({
			operationName: 'CountryByFilter',
			input: {
				filter: {
					code: {
						eq: '',
					},
				},
			},
		});

		// Lookup country by code with empty code, should return no resultss
		expect(withoutCode.error).toBeUndefined();
		expect(withoutCode.data?.countries_countries?.length).toBe(0);
	});

	it('it returns an error when looking up by empty query with validation', async () => {
		const client = wg.client();
		const withoutCodeValidated = await client.query({
			operationName: 'CountryByFilterValidated',
			input: {
				filter: {
					code: {
						eq: '',
					},
				},
			},
		});

		// Lookup country by code with empty code validating the code against
		// a regular expression, should return a validation error
		expect(withoutCodeValidated.data).toBeUndefined();
		expect(withoutCodeValidated.error).toBeDefined();
		expect(withoutCodeValidated.error).toBeInstanceOf(InputValidationError);
		let validationError = withoutCodeValidated.error as InputValidationError;
		expect(validationError.errors[0].propertyPath).toBe('/filter/code/eq');
		expect(validationError.errors[0].message).toMatch(/\[A-Z]\{2\}/);
	});
});
