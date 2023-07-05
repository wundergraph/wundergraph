import axios from 'axios';
import { Operation, OperationType } from '@wundergraph/protobuf';
import { ClientRequest } from './types';
import { encodeRawClientRequest } from './server';

export interface OperationArgsWithInput<T = void> {
	input: T;
}

interface InternalClientRequestContext {
	// used as "context" in operation methods to access request based properties
	context: {
		extraHeaders?: { [key: string]: string };
		clientRequest?: ClientRequest;
	};
}
export interface Operations<
	Queries extends OperationDefinitions = OperationDefinitions,
	Mutations extends OperationDefinitions = OperationDefinitions
> {
	queries: Queries;
	mutations: Mutations;
}

export interface OperationDefinitions {
	[operationName: string]: any;
}

export interface InternalClient<
	Queries extends OperationDefinitions = OperationDefinitions,
	Mutations extends OperationDefinitions = OperationDefinitions
> extends Operations<Queries, Mutations> {
	withHeaders: (headers: { [key: string]: string }) => InternalClient<Queries, Mutations>;
}

export interface InternalClientFactory {
	(extraHeaders?: { [p: string]: string } | undefined, clientRequest?: ClientRequest): InternalClient;
}

// internalClientFactory is a factory function that creates an internal client.
// this function should be only called once on startup.
export const internalClientFactory = (operations: Operation[], baseNodeUrl: string): InternalClientFactory => {
	const baseOperations: Operations & InternalClientRequestContext = {
		context: {
			clientRequest: undefined,
			extraHeaders: undefined,
		},
		queries: {},
		mutations: {},
	};

	Object.setPrototypeOf(baseOperations.queries, baseOperations);
	Object.setPrototypeOf(baseOperations.mutations, baseOperations);

	operations
		.filter((op) => op.operationType == OperationType.QUERY)
		.forEach((op) => {
			if (baseOperations.queries) {
				baseOperations.queries[op.name] = async function (
					this: InternalClientRequestContext,
					options?: OperationArgsWithInput<any>
				) {
					return internalRequest({
						extraHeaders: this.context.extraHeaders,
						clientRequest: this.context.clientRequest,
						operationName: op.path,
						input: options?.input,
					});
				};
			}
		});

	operations
		.filter((op) => op.operationType == OperationType.MUTATION)
		.forEach((op) => {
			if (baseOperations.mutations) {
				baseOperations.mutations[op.name] = async function (
					this: InternalClientRequestContext,
					options?: OperationArgsWithInput<any>
				) {
					return internalRequest({
						extraHeaders: this.context.extraHeaders,
						clientRequest: this.context.clientRequest,
						operationName: op.path,
						input: options?.input,
					});
				};
			}
		});

	const internalRequest = async (options: {
		operationName: string;
		input?: any;
		extraHeaders?: { [key: string]: string };
		clientRequest?: ClientRequest;
	}): Promise<any> => {
		const url = `${baseNodeUrl}/operations/${options.operationName}`;
		const headers = Object.assign(
			{},
			{
				'Content-Type': 'application/json',
				...(options.extraHeaders || {}),
			}
		);
		const __wg = {
			clientRequest: options.clientRequest
				? encodeRawClientRequest(options.clientRequest, options.extraHeaders)
				: undefined,
		};
		const res = await axios.post(url, JSON.stringify({ input: options.input, __wg }), {
			headers,
		});
		return res.data;
	};

	// build creates a new client instance. We create a new instance per request.
	// this function is cheap because we only create objects.
	return function build(extraHeaders?: { [key: string]: string }, clientRequest?: ClientRequest): InternalClient {
		// let's inherit the base operation methods from the base client
		// but create a new object to avoid mutating the base client
		const client: InternalClient & InternalClientRequestContext = Object.create(baseOperations);
		client.withHeaders = (headers: { [key: string]: string }) => {
			return build(headers, clientRequest);
		};
		client.context.clientRequest = clientRequest;
		client.context.extraHeaders = extraHeaders;

		return client;
	};
};
