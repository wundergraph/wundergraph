import { OperationExecutionEngine, OperationType } from '@wundergraph/protobuf';
import { Collection } from 'postman-collection';
import { PostmanBuilder } from './builder';

const operations = [
	{
		Name: 'GetName',
		PathName: 'location/GetName',
		Content: 'query GetName{name:me{name}}',
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
		Name: 'GetName',
		PathName: 'location/GetName',
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
		PathName: 'location/query/GetUser',
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
		Name: 'GetCart',
		PathName: 'location/query/GetUser',
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
		Name: 'GetSetUser',
		PathName: 'location/query/SetUser',
		OperationType: OperationType.MUTATION,
		ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
		VariablesSchema: {
			type: 'object',
			properties: {},
			additionalProperties: false,
			definitions: {},
		},
	},
	{
		Name: 'NewGetSetUser',
		PathName: 'location/query/new/SetUser',
		OperationType: OperationType.MUTATION,
		ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
		VariablesSchema: {
			type: 'object',
			properties: {},
			additionalProperties: false,
			definitions: {},
		},
	},
] as any;

test('getNestedCollection', async () => {
	const result = PostmanBuilder(operations, { baseURL: 'http://localhost:9991' });

	expect(result).toMatchSnapshot();
});
