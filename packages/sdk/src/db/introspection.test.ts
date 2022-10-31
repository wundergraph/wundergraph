import { assert } from 'chai';
import {
	cleanupPrismaSchema,
	introspectPrismaDatabaseWithRetries,
	PrismaDatabaseIntrospectionResult,
} from './introspection';
import fs from 'fs';
import path from 'path';
import { DatabaseIntrospection } from '../definition';

test.skip('introspection', async () => {
	const result = await introspectPrismaDatabaseWithRetries(
		{
			databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
		},
		'postgresql',
		1
	);
	assert.equal(result.success, true);
});

test('cleanupPrismaSchema', async () => {
	const rawSchema = fs.readFileSync(path.resolve(__dirname, './testdata/schema.graphql.file'));
	const schema = rawSchema.toString('utf-8');
	const introspection: DatabaseIntrospection = {
		databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
		schemaExtension: `
				type Contact {
					type: String
					phone: String
				}
				input ContactInput {
					type: String
					phone: String
				}
				`,
		replaceJSONTypeFields: [
			{
				entityName: `users`,
				fieldName: `contact`,
				responseTypeReplacement: `Contact`,
				inputTypeReplacement: `ContactInput`,
			},
		],
	};
	const result: PrismaDatabaseIntrospectionResult = {
		graphql_schema: schema,
		interpolateVariableDefinitionAsJSON: [],
		jsonResponseFields: [],
		jsonTypeFields: [],
		message: '',
		prisma_schema: '',
		success: false,
	};

	const cleanedSchema = cleanupPrismaSchema(introspection, result);

	assert.equal(result.jsonTypeFields.length, 1);
	assert.equal(result.jsonResponseFields.length, 0);
	assert.equal(result.interpolateVariableDefinitionAsJSON.length, 2);

	expect(cleanedSchema).toMatchSnapshot();
});
