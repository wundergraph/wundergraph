import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

describe('OpenAPI spec generation', () => {
	it('OpenAPI includes GraphQL operation response schema', async () => {
		const filePath = join(__dirname, '.wundergraph', 'generated', 'wundergraph.openapi.json');
		const data = await readFile(filePath, { encoding: 'utf-8' });
		const spec = JSON.parse(data);

		const countryByFilter = spec.paths?.['/CountryByFilter'];
		expect(countryByFilter).toBeDefined();

		const response = countryByFilter?.['get']?.['responses']?.['200'];
		expect(response).toBeDefined();

		const responseSchema = response['content']?.['application/json']?.['schema'];
		expect(responseSchema).toBeDefined();
		expect(responseSchema['properties']?.['data']?.['type']).toBe('object');
	});

	it('OpenAPI includes TypeScript operation response schema', async () => {
		const filePath = join(__dirname, '.wundergraph', 'generated', 'wundergraph.openapi.json');
		const data = await readFile(filePath, { encoding: 'utf-8' });
		const spec = JSON.parse(data);

		const countryByFilter = spec.paths?.['/functions/simple'];
		expect(countryByFilter).toBeDefined();

		const response = countryByFilter?.['get']?.['responses']?.['200'];
		expect(response).toBeDefined();

		const responseSchema = response['content']?.['application/json']?.['schema'];
		expect(responseSchema).toBeDefined();
		expect(responseSchema['properties']?.['data']?.['type']).toBe('string');
	});
});
