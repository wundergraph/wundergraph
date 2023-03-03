import { OperationExecutionEngine, OperationType } from '@wundergraph/protobuf';
import { GraphQLOperation } from '../graphql/operations';
import { OpenAPIBuilder } from './index';

const operations = [
	{
		Name: 'GetRootObj',
		PathName: 'GetRootObj',
		OperationType: OperationType.QUERY,
		ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
		VariablesSchema: {
			type: 'object',
			properties: {},
			additionalProperties: false,
			definitions: {},
		},
	},
	{
		Name: 'GetRootObj2',
		PathName: 'GetRootObj2',
		OperationType: OperationType.QUERY,
		ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
		VariablesSchema: {
			type: 'object',
			properties: {},
			additionalProperties: false,
			definitions: {},
		},
	},
	{
		Name: 'GetUser',
		PathName: 'item/GetID',
		OperationType: OperationType.QUERY,
		ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
		VariablesSchema: {
			type: 'object',
			properties: {},
			additionalProperties: false,
			definitions: {},
		},
	},
] as GraphQLOperation[];

describe('OpenAPI builder', () => {
	test('no operations', async () => {
		const apiTitle = 'WunderGraph';
		const apiVersion = '1';
		const apiPublicUrl = 'http://localhost:9991';
		const builder = new OpenAPIBuilder({
			title: apiTitle,
			version: apiVersion,
			baseURL: apiPublicUrl,
		});
		const result = builder.generate([]);
		expect(result.openapi).toBe('3.1.0');
		expect(result.info.title).toBe(apiTitle);
		expect(result.info.version).toBe(apiVersion);
		expect(result.servers[0].url).toBe(apiPublicUrl);
	});

	test('operation properties', async () => {
		const builder = new OpenAPIBuilder({
			title: 'WunderGraph',
			version: '1.0',
			baseURL: 'http://localhost:9991',
		});
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
		const result = builder.generate(operations);

		const querySpec = result.paths['/operations/QueryPath'];
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

		const mutationSpec = result.paths['/operations/MutationPath'];
		expect(mutationSpec).toBeDefined();
		expect(mutationSpec.get).toBeUndefined();
		expect(mutationSpec.post?.operationId).toBe('Mutation');
		expect(mutationSpec.post?.requestBody?.content['application/json'].schema).toBe(operations[1].VariablesSchema);
		const mutationResponse = mutationSpec.post?.responses['200'];
		expect(mutationResponse).toBeDefined();
		expect(mutationResponse?.content['application/json'].schema).toBe(operations[1].ResponseSchema);
	});

	test('OpenAPI Builder', async () => {
		const builder = new OpenAPIBuilder({
			title: 'WunderGraph',
			version: '0',
			baseURL: 'http://localhost:9991',
		});
		const result = builder.generate(operations);

		expect(result).toMatchSnapshot();
	});
});
