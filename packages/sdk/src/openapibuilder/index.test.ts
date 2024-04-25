import { JSONSchema7 } from 'json-schema';

import { OperationExecutionEngine, OperationType } from '@wundergraph/protobuf';
import { GraphQLOperation } from '../graphql/operations';
import { OpenApiBuilder, isValidOpenApiSchemaName } from './index';
import { JSONSchema } from 'json-schema-to-typescript';

const emptySchema: JSONSchema7 = {
	type: 'object',
	properties: {},
	additionalProperties: false,
};

const personSchema: JSONSchema7 = {
	type: 'object',
	properties: {
		data: {
			$ref: '#/definitions/Person',
		},
	},
	additionalProperties: false,
	definitions: {
		Person: {
			type: 'object',
			properties: {
				name: { type: 'string' },
				surname: { type: 'string' },
				age: { type: 'number' },
			},
			required: ['name', 'surname'],
			additionalProperties: false,
		},
	},
};

const operations = [
	{
		Name: 'GetRootObj',
		PathName: 'GetRootObj',
		OperationType: OperationType.QUERY,
		ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
		VariablesSchema: emptySchema,
		ResponseSchema: emptySchema,
	},
	{
		Name: 'GetRootObj2',
		PathName: 'GetRootObj2',
		OperationType: OperationType.QUERY,
		ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
		VariablesSchema: emptySchema,
		ResponseSchema: emptySchema,
	},
	{
		Name: 'GetUser',
		PathName: 'users/get',
		OperationType: OperationType.QUERY,
		ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
		VariablesSchema: emptySchema,
		ResponseSchema: emptySchema,
	},
	{
		Name: 'SubscribeToUser',
		PathName: 'users/subscribe',
		OperationType: OperationType.SUBSCRIPTION,
		ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
		VariablesSchema: emptySchema,
		ResponseSchema: emptySchema,
	},
	{
		Name: 'PutUser',
		PathName: 'users/put',
		OperationType: OperationType.MUTATION,
		ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
		AuthenticationConfig: { required: true },
		VariablesSchema: personSchema,
		ResponseSchema: emptySchema,
	},
] as GraphQLOperation[];

const build = (operations: GraphQLOperation[]) => {
	const builder = new OpenApiBuilder({
		title: 'WunderGraph',
		version: '0',
		baseURL: 'http://localhost:9991',
	});
	return builder.build(operations);
};

describe('OpenAPI builder', () => {
	test('no operations', async () => {
		const apiTitle = 'WunderGraph';
		const apiVersion = '1';
		const apiPublicUrl = 'http://localhost:9991';
		const builder = new OpenApiBuilder({
			title: apiTitle,
			version: apiVersion,
			baseURL: apiPublicUrl,
		});
		const result = builder.build([]);
		expect(result.openapi).toBe('3.1.0');
		expect(result.info.title).toBe(apiTitle);
		expect(result.info.version).toBe(apiVersion);
		expect(result.servers[0].url).toBe(`${apiPublicUrl}/operations`);
	});

	test('operation properties', async () => {
		const operations = [
			{
				Name: 'Query',
				PathName: 'QueryPath',
				OperationType: OperationType.QUERY,
				ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
				VariablesSchema: {
					type: 'object',
					properties: {
						input: {
							type: 'string',
						},
					},
					additionalProperties: false,
				},
				ResponseSchema: {
					type: 'object',
					properties: {
						output: {
							type: 'string',
						},
					},
					additionalProperties: false,
				},
			},
			{
				Name: 'Mutation',
				PathName: 'MutationPath',
				OperationType: OperationType.MUTATION,
				ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
				VariablesSchema: {
					type: 'object',
					properties: {
						input: {
							type: 'string',
						},
					},
					required: ['string'],
					additionalProperties: false,
				},
				ResponseSchema: {
					type: 'object',
					properties: {
						output: {
							type: 'string',
						},
					},
					additionalProperties: false,
				},
			},
		] as unknown as GraphQLOperation[];
		const result = build(operations);

		const querySpec = result.paths['/QueryPath'];
		expect(querySpec).toBeDefined();
		expect(querySpec.post).toBeUndefined();
		expect(querySpec.get?.operationId).toBe('Query');
		expect(querySpec.get?.parameters?.[0].name).toBe('input');
		expect(querySpec.get?.parameters?.[0].in).toBe('query');
		expect(querySpec.get?.parameters?.[0].required).toBe(false);
		expect(querySpec.get?.parameters?.[0].schema).toStrictEqual({ type: 'string' });
		const queryResponse = querySpec.get?.responses['200'];
		expect(queryResponse).toBeDefined();
		expect(queryResponse?.content['application/json'].schema).toEqual(operations[0].ResponseSchema);

		const mutationSpec = result.paths['/MutationPath'];
		expect(mutationSpec).toBeDefined();
		expect(mutationSpec.get).toBeUndefined();
		expect(mutationSpec.post?.operationId).toBe('Mutation');
		expect(mutationSpec.post?.requestBody?.content['application/json'].schema).toEqual(operations[1].VariablesSchema);
		const mutationResponse = mutationSpec.post?.responses['200'];
		expect(mutationResponse).toBeDefined();
		expect(mutationResponse?.content['application/json'].schema).toEqual(operations[1].ResponseSchema);
	});

	test('skip internal operations', async () => {
		const operations = [
			{
				Name: 'Query',
				PathName: 'QueryPath',
				OperationType: OperationType.QUERY,
			},
			{
				Name: 'InternalQuery',
				PathName: 'InternalQueryPath',
				OperationType: OperationType.QUERY,
				Internal: true,
			},
		] as unknown as GraphQLOperation[];
		const result = build(operations);
		expect(Object.keys(result.paths).length).toBe(1);
		expect(result.paths['/QueryPath']).toBeDefined();
		expect(result.paths['/InternalQueryPath']).toBeUndefined();
	});

	test('annotate operations', async () => {
		const operations = [
			{
				Name: 'Query',
				PathName: 'QueryPath',
				OperationType: OperationType.QUERY,
			},
			{
				Name: 'Mutation',
				PathName: 'MutationPath',
				OperationType: OperationType.MUTATION,
				AuthenticationConfig: { required: true },
				VariablesSchema: personSchema,
				ResponseSchema: personSchema,
			},
			{
				Name: 'Subscription',
				PathName: 'SubscriptionPath',
				OperationType: OperationType.SUBSCRIPTION,
			},
		] as unknown as GraphQLOperation[];

		const result = build(operations);
		expect(Object.keys(result.paths).length).toBe(3);
		const query = result.paths['/QueryPath'].get;
		expect(query?.['x-wundergraph-operation-type']).toBe('query');
		expect(query?.['x-wundergraph-requires-authentication']).toBe(false);
		const mutation = result.paths['/MutationPath'].post;
		expect(mutation?.['x-wundergraph-operation-type']).toBe('mutation');
		expect(mutation?.['x-wundergraph-requires-authentication']).toBe(true);
		const subscription = result.paths['/SubscriptionPath'].get;
		expect(subscription?.['x-wundergraph-operation-type']).toBe('subscription');
		expect(subscription?.['x-wundergraph-requires-authentication']).toBe(false);
	});

	test('rewrite references and generate valid names inside anyOf', () => {
		const operations = [
			{
				Name: 'Weather',
				PathName: 'weather/get',
				OperationType: OperationType.QUERY,
				ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
				VariablesSchema: emptySchema,
				ResponseSchema: {
					type: 'object',
					properties: {
						weather: {
							anyOf: [
								{
									$ref: '#/definitions/{readonlysummary:{readonlytitle:string|null;readonlydescription:string|null;readonlyicon:string|null;}|null;}',
								},
								{
									type: 'null',
								},
							],
						},
					},
					required: ['weather'],
					definitions: {
						'{readonlysummary:{readonlytitle:string|null;readonlydescription:string|null;readonlyicon:string|null;}|null;}':
							{
								type: 'string',
							},
					},
				},
			},
		] as unknown as GraphQLOperation[];

		const result = build(operations);
		const operation = result.paths['/weather/get'].get;
		const responseSchema = operation?.responses?.['200']?.content?.['application/json']?.schema;
		const weather = responseSchema?.properties?.['weather'];
		const firstAnyOf = (weather as JSONSchema7).anyOf?.[0];
		const firstRef = (firstAnyOf as JSONSchema7).$ref;
		expect(firstRef).toMatch(/#\/components\/schemas\/.*/);

		const refName = firstRef?.substring('#/components/schemas/'.length);
		expect(refName).toBeDefined();
		expect(isValidOpenApiSchemaName(refName!)).toBeTruthy();
		expect(result.components?.schemas?.[refName!]).toBeDefined();
	});

	test('move definitions from input to /components/schemas', () => {
		const operations = [
			{
				Name: 'PutUser',
				PathName: 'users/put',
				OperationType: OperationType.MUTATION,
				ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
				AuthenticationConfig: { required: true },
				VariablesSchema: personSchema,
				ResponseSchema: emptySchema,
			},
		] as unknown as GraphQLOperation[];

		const result = build(operations);
		const operation = result.paths['/users/put'].post;
		const inputSchema = operation?.requestBody?.content?.['application/json']?.schema;
		expect((inputSchema?.properties?.['data'] as JSONSchema)?.$ref).toBe('#/components/schemas/Person');
		const personDefinition = result?.components?.schemas?.['Person'];
		expect(personDefinition).toBeDefined();
		expect(personDefinition).toEqual(personSchema?.definitions?.['Person']);
	});

	test('rename different types with same name', () => {
		const userSchema: JSONSchema = {
			type: 'object',
			properties: {
				name: { type: 'string' },
				surname: { type: 'string' },
			},
			required: ['name', 'surname'],
			additionalProperties: false,
		};
		const user2Schema: JSONSchema = {
			type: 'object',
			properties: {
				username: { type: 'string' },
				age: { type: 'number' },
			},
			required: ['username', 'age'],
			additionalProperties: false,
		};
		const user3Schema: JSONSchema = {
			type: 'object',
			properties: {
				username: { type: 'string' },
				city: { type: 'string' },
			},
			required: ['username', 'city'],
			additionalProperties: false,
		};

		const operations = [
			{
				Name: 'GetUserA',
				PathName: 'users/getA',
				OperationType: OperationType.QUERY,
				ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
				VariablesSchema: emptySchema,
				ResponseSchema: {
					type: 'object',
					properties: {
						data: {
							$ref: '#/definitions/User',
						},
					},
					additionalProperties: false,
					definitions: {
						User: userSchema,
					},
				},
			},
			{
				Name: 'GetUserB',
				PathName: 'users/getB',
				OperationType: OperationType.QUERY,
				ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
				VariablesSchema: emptySchema,
				ResponseSchema: {
					type: 'object',
					properties: {
						data: {
							$ref: '#/definitions/User',
						},
					},
					additionalProperties: false,
					definitions: {
						User: user2Schema,
					},
				},
			},
			{
				Name: 'GetUserC',
				PathName: 'users/getC',
				OperationType: OperationType.QUERY,
				ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
				VariablesSchema: emptySchema,
				ResponseSchema: {
					type: 'object',
					properties: {
						data: {
							$ref: '#/definitions/User',
						},
					},
					additionalProperties: false,
					definitions: {
						User: user3Schema,
					},
				},
			},
			{
				Name: 'GetUserD',
				PathName: 'users/getD',
				OperationType: OperationType.QUERY,
				ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
				VariablesSchema: emptySchema,
				ResponseSchema: {
					type: 'object',
					properties: {
						data: {
							$ref: '#/definitions/User',
						},
					},
					additionalProperties: false,
					definitions: {
						User: user2Schema,
					},
				},
			},
			{
				Name: 'SetUserE',
				PathName: 'users/setE',
				OperationType: OperationType.MUTATION,
				ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
				VariablesSchema: {
					type: 'object',
					properties: {
						data: {
							$ref: '#/definitions/User',
						},
					},
					additionalProperties: false,
					definitions: {
						User: user3Schema,
					},
				},
				ResponseSchema: emptySchema,
			},
		] as unknown as GraphQLOperation[];

		const result = build(operations);
		const operationA = result.paths['/users/getA'].get;
		const operationB = result.paths['/users/getB'].get;
		const operationC = result.paths['/users/getC'].get;
		const operationD = result.paths['/users/getD'].get;
		const operationE = result.paths['/users/setE'].post;

		const responseASchema = operationA?.responses?.['200']?.content?.['application/json']?.schema;
		expect((responseASchema?.properties?.['data'] as JSONSchema7)?.$ref).toBe('#/components/schemas/User');

		const responseBSchema = operationB?.responses?.['200']?.content?.['application/json']?.schema;
		expect((responseBSchema?.properties?.['data'] as JSONSchema7)?.$ref).toBe('#/components/schemas/User_2');

		const responseCSchema = operationC?.responses?.['200']?.content?.['application/json']?.schema;
		expect((responseCSchema?.properties?.['data'] as JSONSchema7)?.$ref).toBe('#/components/schemas/User_3');

		const responseDSchema = operationD?.responses?.['200']?.content?.['application/json']?.schema;
		expect((responseDSchema?.properties?.['data'] as JSONSchema7)?.$ref).toBe('#/components/schemas/User_2');

		const inputESchema = operationE?.requestBody?.content?.['application/json']?.schema;
		expect((inputESchema?.properties?.['data'] as JSONSchema7)?.$ref).toBe('#/components/schemas/User_3');

		const schemas = result?.components?.schemas;

		expect(schemas?.['User']).toEqual(userSchema);
		expect(schemas?.['User_2']).toEqual(user2Schema);
		expect(schemas?.['User_3']).toEqual(user3Schema);
	});

	test('Empty payload in mutation returns properly formatted openapi schema', () => {
		const operations = [
			{
				Name: 'Mutate',
				PathName: 'path/mutate',
				OperationType: OperationType.MUTATION,
				ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
				VariablesSchema: emptySchema,
				ResponseSchema: emptySchema,
			},
		] as unknown as GraphQLOperation[];

		const result = build(operations);
		const operation = result.paths['/path/mutate'].post;
		const requestBodyContent = operation?.requestBody?.content;
		const requestBodyRequired = operation?.requestBody?.required;
		expect(requestBodyRequired).toBeFalsy();
		expect(requestBodyContent?.['application/json']).toEqual({});
	});
	test('OpenAPI Builder', async () => {
		const builder = new OpenApiBuilder({
			title: 'WunderGraph',
			version: '0',
			baseURL: 'http://localhost:9991',
		});
		const result = builder.build(operations);

		expect(result).toMatchSnapshot();
	});
});
