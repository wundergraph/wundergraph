import { JSONSchema7 } from 'json-schema';

import { OperationExecutionEngine, OperationType } from '@wundergraph/protobuf';
import { GraphQLOperation } from '../graphql/operations';
import { OpenApiBuilder, isValidOpenApiSchemaName } from './index';

const emptySchema = {
	type: 'object',
	properties: {},
	additionalProperties: false,
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
		VariablesSchema: emptySchema,
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
		expect(queryResponse?.content['application/json'].schema).toBe(operations[0].ResponseSchema);

		const mutationSpec = result.paths['/MutationPath'];
		expect(mutationSpec).toBeDefined();
		expect(mutationSpec.get).toBeUndefined();
		expect(mutationSpec.post?.operationId).toBe('Mutation');
		expect(mutationSpec.post?.requestBody?.content['application/json'].schema).toBe(operations[1].VariablesSchema);
		const mutationResponse = mutationSpec.post?.responses['200'];
		expect(mutationResponse).toBeDefined();
		expect(mutationResponse?.content['application/json'].schema).toBe(operations[1].ResponseSchema);
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
