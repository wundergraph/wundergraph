import fs from 'fs';
import { OperationExecutionEngine, OperationType } from '@wundergraph/protobuf';
import { PostmanBuilder } from './builder';

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
	{
		Name: 'GetUser',
		PathName: 'location/GetID',
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
		PathName: 'location/GetUser',
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
		Name: 'GetUser2',
		PathName: 'location/query/GetUser2',
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
		PathName: 'location/query/GetCart',
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
	{
		Name: 'Internal',
		PathName: 'internal/query/internal',
		Internal: true,
		OperationType: OperationType.QUERY,
		ExecutionEngine: OperationExecutionEngine.ENGINE_NODEJS,
		VariablesSchema: {
			type: 'object',
			properties: {},
			additionalProperties: false,
			definitions: {},
		},
	},
] as any;

const countPostmanOperations = (obj: any) => {
	let count = 0;
	if (obj.request) {
		count += 1;
	}
	const item = obj.item;
	if (item) {
		if (Array.isArray(item)) {
			for (const element of item) {
				count += countPostmanOperations(element);
			}
		} else {
			count += countPostmanOperations(item);
		}
	}
	return count;
};

test.only('PostmanBuilder', async () => {
	const result = PostmanBuilder(operations, { baseURL: 'http://localhost:9991' });

	const internalOperationsCount = 1;
	const c = countPostmanOperations(result.toJSON());
	expect(c).toBe(operations.length - internalOperationsCount);

	if (process.env.WRITE_POSTMAN_COLLECTION) {
		fs.writeFileSync('postman.json', JSON.stringify(result.toJSON(), null, 2), 'utf-8');
	}

	expect(result).toMatchSnapshot();
});
