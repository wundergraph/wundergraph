import fs from 'fs/promises';
import path from 'path';

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { InputValidationError } from '@wundergraph/sdk/client';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer();

beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('functions', () => {
	test('internal operation call from  function', async () => {
		const client = wg.client();
		const promises = [];
		// Call this 50 times to exercise some code paths that share cached
		// buffers. If we have a race condition in there, the go race detector
		// (which we use in CI) will likely catch it.
		for (let ii = 0; ii < 50; ii++) {
			const op = client.query({
				operationName: 'nested/InternalWrapper',
			});
			promises.push(op);
		}
		const results = await Promise.all(promises);
		for (const result of results) {
			expect(result.error).toBeUndefined();
			expect(result.data?.data?.chinook_findFirstAlbum?.AlbumId).toBe(1);
		}
	});

	test('internal directory operation call from function', async () => {
		const client = wg.client();
		const promises = [];
		for (let ii = 0; ii < 50; ii++) {
			const op = client.query({
				operationName: 'nested/InternalDirectoryWrapper',
			});
			promises.push(op);
		}
		const results = await Promise.all(promises);
		for (const result of results) {
			expect(result.error).toBeUndefined();
			expect(result.data?.data?.chinook_findFirstAlbum?.AlbumId).toBe(1);
		}
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

describe('@transform directive', () => {
	test('@transform in public operation', async () => {
		const result = await wg.client().query({
			operationName: 'CountryWeather',
			input: {
				countryCode: 'ES',
			},
		});
		expect(result.error).toBeUndefined();
		const country = result?.data?.country?.[0];
		expect(country).toBeDefined();
		expect(country?.capital).toBe('Madrid');
		expect(country?.weather.temperature?.max).toBeDefined();
	});
	test('@transform in internal operation', async () => {
		const result = await wg.client().query({
			operationName: 'CountryWeatherViaInternal',
			input: {
				countryCode: 'ES',
			},
		});
		expect(result.error).toBeUndefined();
		const country = result?.data?.data?.country?.[0];
		expect(country).toBeDefined();
		expect(country?.capital).toBe('Madrid');
		expect(country?.weather.temperature?.max).toBeDefined();
	});
});

describe('OpenAPI generation', () => {
	test('OpenAPI includes TypeScript operation response schema', async () => {
		const filePath = path.join(__dirname, '..', '.wundergraph', 'generated', 'wundergraph.openapi.json');
		const data = await fs.readFile(filePath, { encoding: 'utf-8' });
		const spec = JSON.parse(data);
		const usersGet = spec.paths?.['/users/get'];
		expect(usersGet).toBeDefined();
		const response = usersGet?.['get']?.['responses']?.['200'];
		expect(response).toBeDefined();
		const responseSchema = response['content']?.['application/json']?.['schema'];
		expect(responseSchema).toBeDefined();
		expect(responseSchema['properties']?.['hello']?.['type']).toBe('string');
	});
});
