import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { InputValidationError } from '@wundergraph/sdk/client';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer();

// TODO: Remove this once the secret refactor is done
process.env['WG_SECURE_COOKIE_HASH_KEY'] = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env['WG_SECURE_COOKIE_BLOCK_KEY'] = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env['WG_CSRF_TOKEN_SECRET'] = 'aaaaaaaaaaa';

beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('functions', () => {
	test('internal operation call from  function', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'nested/InternalWrapper',
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.data?.chinook_findFirstAlbum?.AlbumId).toBe(1);
	});
});

describe('@jsonSchema', () => {
	test('it returns one result when looking up by matching query', async () => {
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
	test('it returns no results when looking up by empty query', async () => {
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

	test('it returns an error when looking up by empty query with validation', async () => {
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

describe('sql', () => {
	test('execute raw', async () => {
		const client = wg.client();
		const result = await client.mutate({
			operationName: 'rawsql/ExecuteRaw',
			input: {
				id: '2',
				name: 'Jannik',
				email: 'jannik@wundergraph.com',
			},
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.users_post_executeRaw).toBe(0);
		console.log(JSON.stringify(result));
	});
	test('execute raw inline', async () => {
		const client = wg.client();
		const result = await client.mutate({
			operationName: 'rawsql/ExecuteRawInline',
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.users_post_executeRaw).toBe(0);
		console.log(JSON.stringify(result));
	});
	test('query raw json', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'rawsql/QueryRawJSON',
		});
		expect(result.error).toBeUndefined();
		expect(JSON.stringify(result.data?.json)).toEqual(
			`[{"id":1,"email":"jens@wundergraph.com","name":"Jens"},{"id":2,"email":"jannik@wundergraph.com","name":"Jannik"}]`
		);
	});
	test('query raw row', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'rawsql/QueryRow',
			input: {
				email: 'jens@wundergraph.com',
			},
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.row[0].id).toEqual(1);
		expect(result.data?.row[0].name).toEqual('Jens');
		expect(result.data?.row[0].email).toEqual('jens@wundergraph.com');
	});
	test('query raw row inline', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'rawsql/QueryRowInline',
		});
		expect(result.error).toBeUndefined();
		console.log(JSON.stringify(result.data?.row));
		expect(result.data?.row[0].id).toEqual(2);
		expect(result.data?.row[0].name).toEqual('Jannik');
		expect(result.data?.row[0].email).toEqual('jannik@wundergraph.com');
	});
});
