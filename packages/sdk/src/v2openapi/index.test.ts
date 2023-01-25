import { getFormattedFieldName, getFormattedPath, openApiSpecificationToRESTApiObject, RESTApiBuilder } from './index';
import * as fs from 'fs';
import path from 'path';
import { JSONSchema7Type } from 'json-schema';
import { EnumTypeDefinitionNode } from 'graphql';

const runTest = async (testFile: string, snapShot: string, statusCodeUnions?: boolean) => {
	const exists = fs.existsSync(testFile);
	if (!exists) {
		return;
	}
	const fileContents = fs.readFileSync(testFile).toString();
	const actual = await openApiSpecificationToRESTApiObject(fileContents, {
		apiNamespace: 'api',
		authentication: undefined,
		headers: undefined,
		source: {
			kind: 'string',
			openAPISpec: fileContents,
		},
		statusCodeUnions,
	});
	expect(actual.Schema).toMatchSnapshot(snapShot + '_' + 'schema');
	expect(JSON.stringify(actual.DataSources, null, 2)).toMatchSnapshot(snapShot + '_' + 'data_sources');
	expect(JSON.stringify(actual.Fields, null, 2)).toMatchSnapshot(snapShot + '_' + 'fields');
};

test('complex oas3', async () => {
	await runTest('src/v2openapi/testdata/complex_oas3.json', 'complex_oas3');
});

test('complex2 oas3', async () => {
	await runTest('src/v2openapi/testdata/complex_2.json', 'complex2_oas3');
});

test('key_client', async () => {
	await runTest('src/v2openapi/testdata/keycloak.json', 'keycloak');
});

test('httpbin', async () => {
	await runTest('src/v2openapi/testdata/httpbin.json', 'httpbin');
});

test('simple petstore', async () => {
	await runTest('src/v2openapi/testdata/simple_petstore.json', 'petstore');
});

test('users', async () => {
	await runTest('src/v2openapi/testdata/users.json', 'users');
});

test('json placeholder', async () => {
	await runTest('src/v2openapi/testdata/jsonplaceholder.v1.yaml', 'json_placeholder');
});

test('fusion', async () => {
	await runTest('src/v2openapi/testdata/fusion.yaml', 'fusion');
});

test('fusion with statusCodeUnions', async () => {
	await runTest('src/v2openapi/testdata/fusion.yaml', 'fusion', true);
});

test('fusion v2 with statusCodeUnions', async () => {
	await runTest('src/v2openapi/testdata/fusionauth_v2.yml', 'fusion_v2', true);
});

test('weather', async () => {
	await runTest('src/v2openapi/testdata/weather.yaml', 'weather');
});

test('with_path_parameters', async () => {
	await runTest('src/v2openapi/testdata/with_path_parameters.yaml', 'fusion');
});

test('with url encoded params', async () => {
	await runTest('src/v2openapi/testdata/stripe_query.yaml', 'stripe_query');
});

test('petstore', async () => {
	await runTest('src/v2openapi/testdata/petstore.yaml', 'petstore');
});

test('json placeholder array', async () => {
	await runTest('src/v2openapi/testdata/json_placeholder.json', 'jsp_array');
});

test('github starred with unions', async () => {
	await runTest('src/v2openapi/testdata/github.json', 'github_starred', true);
});

test('dynamic baseurl', async () => {
	await runTest('src/v2openapi/testdata/dynamic_baseurl.json', 'dynamic_baseurl');
});

test('subscription as object field', async () => {
	await runTest('src/v2openapi/testdata/oas_with_subscription.yaml', 'subscription_as_object_field');
});

test('non alphanumeric fields', async () => {
	await runTest('src/v2openapi/testdata/non_alphanumeric_fields.yaml', 'non_alphanumeric_fields');
});

test('arbitrary type', async () => {
	const fileContents = fs.readFileSync(path.resolve(__dirname, './testdata/users_meta.json')).toString('utf-8');

	const actual = await openApiSpecificationToRESTApiObject(fileContents, {
		apiNamespace: 'api',
		source: {
			kind: 'string',
			openAPISpec: fileContents,
		},
		schemaExtension: `
				type Contact {
					type: String
					phone: String
				}
				`,
		replaceCustomScalarTypeFields: [
			{
				entityName: `User`,
				fieldName: `contact`,
				responseTypeReplacement: `Contact`,
			},
		],
	});

	expect(actual.Schema).toMatchSnapshot('users_meta_schema');
});

describe('RestApiBuilderTests', () => {
	const newRestApiBuilder = () =>
		new RESTApiBuilder(
			{ info: { title: '', version: '' }, openapi: '', paths: {} },
			{ source: { kind: 'object', openAPIObject: {} } }
		);

	describe('GraphQL name normalisation tests', () => {
		test('that invalid GraphQL names are normalised correctly', () => {
			const restApiBuilder = newRestApiBuilder();
			expect(restApiBuilder.getUniqueNormalisedGraphQLName('1Som3/Ex$*pl_e')).toBe('_1Som3_Ex__pl_e');
		});

		test('that a valid GraphQL enum name remains unchanged', () => {
			const restApiBuilder = newRestApiBuilder();
			expect(restApiBuilder.getUniqueNormalisedGraphQLName('_An_exAMP___LE')).toBe('_An_exAMP___LE');
		});

		test('that a unique name remains unchanged', () => {
			const restApiBuilder = newRestApiBuilder();
			const uniqueName = 'a';
			restApiBuilder['uniqueGraphQLNames'] = new Set(['a_1', 'a_2', 'a_3', 'a_4', 'a_5', 'a_6', 'a_7', 'a_8']);
			expect(restApiBuilder.getUniqueGraphQLName(uniqueName, uniqueName)).toBe(uniqueName);
			expect(restApiBuilder['uniqueGraphQLNames'].has(uniqueName)).toBe(true);
		});

		test('that a unique suffix is added to a name that already exists if the original name has not previously been mapped', () => {
			const restApiBuilder = newRestApiBuilder();
			const nameToNormalise = 'a';
			const normalisedName = 'a_9';
			restApiBuilder['uniqueGraphQLNames'] = new Set(['a', 'a_1', 'a_2', 'a_3', 'a_4', 'a_5', 'a_6', 'a_7', 'a_8']);
			expect(restApiBuilder.getUniqueGraphQLName(nameToNormalise, nameToNormalise)).toBe(normalisedName);
			expect(restApiBuilder['uniqueGraphQLNames'].has('a_9')).toBe(true);
			expect(restApiBuilder['normalisedNames'].get(nameToNormalise)).toBe(normalisedName);
		});

		test('that if the original schema name has already been normalised, that name is returned', () => {
			const restApiBuilder = newRestApiBuilder();
			const nameToNormalise = 'a$&*b';
			const normalisedName = 'a___b';
			const getUniqueGraphQLName = jest.spyOn(restApiBuilder, 'getUniqueGraphQLName');
			restApiBuilder['normalisedNames'].set(nameToNormalise, normalisedName);
			expect(restApiBuilder.getUniqueNormalisedGraphQLName(nameToNormalise)).toBe(normalisedName);
			expect(getUniqueGraphQLName).not.toHaveBeenCalled();
		});
	});

	describe('GraphQL enum handling', () => {
		test('that an enum with no values short circuits', () => {
			const restApiBuilder = newRestApiBuilder();
			const addScalar = jest.spyOn(restApiBuilder, 'addCustomScalarForInvalidEnum');
			const addEnum = jest.spyOn(restApiBuilder, 'addEnumValuesForValidEnum');
			const values: JSONSchema7Type[] = [];
			restApiBuilder.handleEnum('ValidEnumName', values);
			expect(addEnum).not.toHaveBeenCalled();
			expect(addScalar).not.toHaveBeenCalled();
		});

		test('that an enum with values is added as a GraphQL enum', () => {
			const restApiBuilder = newRestApiBuilder();
			const typeName = 'ValidEnumName';
			const node: EnumTypeDefinitionNode = restApiBuilder.buildEnumTypeDefinitionNode(typeName, []);
			let schema = restApiBuilder['graphQLSchema'];
			restApiBuilder['graphQLSchema'] = { ...schema, definitions: [...schema.definitions, node] };
			const addScalar = jest.spyOn(restApiBuilder, 'addCustomScalarForInvalidEnum');
			const addEnum = jest.spyOn(restApiBuilder, 'addEnumValuesForValidEnum');
			const values = ['ValidValueOne', 'ValidValueTwo', 'ValidValueThree'];
			restApiBuilder.handleEnum(typeName, values);
			expect(addEnum).toHaveBeenCalledWith(typeName, new Set(values));
			expect(addScalar).not.toHaveBeenCalled();
			expect((restApiBuilder['graphQLSchema'].definitions[3] as EnumTypeDefinitionNode).values).toHaveLength(
				values.length
			);
		});

		test('that an enum with invalid values is added as a custom scalar', () => {
			const restApiBuilder = newRestApiBuilder();
			const typeName = 'ValidEnumName';
			const addScalar = jest.spyOn(restApiBuilder, 'addCustomScalarForInvalidEnum');
			const addEnum = jest.spyOn(restApiBuilder, 'addEnumValuesForValidEnum');
			const values = ['ValidValueOne', 'ValidValueTwo', 'ValidValue/Three'];
			restApiBuilder.handleEnum(typeName, values);
			expect(addEnum).not.toHaveBeenCalled();
			expect(addScalar).toHaveBeenCalledWith(typeName, new Set(values));
			expect(restApiBuilder['graphQLSchema'].definitions).toHaveLength(4);
			expect(restApiBuilder['enumMappings']).toHaveLength(1);
			expect(restApiBuilder['enumMappings'][0].typeName).toBe(typeName);
			expect(restApiBuilder['enumMappings'][0].values).toEqual(values);
		});

		test('that an enum with invalid values is normalised and added as a custom scalar', () => {
			const restApiBuilder = newRestApiBuilder();
			const typeName = '_2__Valid3numN4me';
			const addScalar = jest.spyOn(restApiBuilder, 'addCustomScalarForInvalidEnum');
			const addEnum = jest.spyOn(restApiBuilder, 'addEnumValuesForValidEnum');
			const values = ['//ValidValueOne', '&ValidValueTwo', '%$ValidValueThree£'];
			restApiBuilder.handleEnum(typeName, values);
			expect(addEnum).not.toHaveBeenCalled();
			expect(addScalar).toHaveBeenCalledWith(typeName, new Set(values));
			expect(restApiBuilder['graphQLSchema'].definitions).toHaveLength(4);
			expect(restApiBuilder['enumMappings']).toHaveLength(1);
			expect(restApiBuilder['enumMappings'][0].typeName).toBe(typeName);
			expect(restApiBuilder['enumMappings'][0].values).toEqual(values);
		});
	});
});

describe('Path formatting tests', () => {
	test('that splitting a path into an empty array remains unformatted', () => {
		expect(getFormattedPath('/')).toBe('/');
	});

	test('that an empty path returns an empty string', () => {
		expect(getFormattedPath('')).toBe('');
	});

	test('that a simple path is formatted correctly', () => {
		expect(getFormattedPath('a/b/')).toBe('aB');
	});

	test('that a path with curly braces is formatted correctly', () => {
		expect(getFormattedPath('/a/{someValue}/b/{someOtherValue}')).toBe('aBySomeValueBBySomeOtherValue');
	});
});

describe('Field name formatting tests', () => {
	test('that a simple field name is formatted correctly', () => {
		expect(getFormattedFieldName('some_field/name')).toBe('someField_name');
	});

	test('that a field name with consecutive underscores is formatted correctly', () => {
		expect(getFormattedFieldName('some__kind_of_field____name/ok')).toBe('someKindOfFieldName_ok');
	});

	test('that a field name with consecutive hyphens is formatted correctly', () => {
		expect(getFormattedFieldName('gimme/some--kind-of-field----name')).toBe('gimme_someKindOfFieldName');
	});

	test('that a field name with consecutive hyphens and underscores is formatted correctly', () => {
		expect(getFormattedFieldName('gimme/some-_other/kind_-_of__----field--___name__pretty/--please')).toBe(
			'gimme_someOther_kindOfFieldNamePretty_Please'
		);
	});
});
