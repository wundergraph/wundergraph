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

test('OpenAPI Builder', async () => {
	const builder = new OpenAPIBuilder({
		title: 'WunderGraph',
		baseURL: 'http://localhost:9991',
	});
	const result = builder.generate(operations);

	expect(result).toMatchSnapshot();
});
