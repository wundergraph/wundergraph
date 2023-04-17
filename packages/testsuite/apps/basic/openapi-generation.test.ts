import { beforeAll, describe, expect, it } from 'vitest';
import { createTestServer } from './.wundergraph/generated/testing';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const wg = createTestServer({
	dir: __dirname,
});

beforeAll(async () => {
	await wg.start();

	return async () => {
		await wg.stop();
	};
});

describe('OpenAPI spec generation', () => {
	it('OpenAPI includes TypeScript operation response schema', async () => {
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
});
