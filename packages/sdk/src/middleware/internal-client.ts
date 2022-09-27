import axios from 'axios';
import { Operation, OperationType } from '@wundergraph/protobuf';
import { ClientRequest } from './types';

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
interface Operations {
	queries: {
		[operationName: string]: (...args: any[]) => Promise<any>;
	};
	mutations: {
		[operationName: string]: any;
	};
}

export interface InternalClient extends Operations {
	withHeaders: (headers: { [key: string]: string }) => InternalClient;
}

export interface InternalClientFactory {
	(extraHeaders?: { [p: string]: string } | undefined, clientRequest?: ClientRequest): InternalClient;
}

// internalClientFactory is a factory function that creates an internal client.
// this function should be only called once on startup.
export const internalClientFactory = (
	apiName: string,
	deploymentName: string,
	operations: Operation[],
	baseNodeUrl: string
): InternalClientFactory => {
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
						operationName: op.name,
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
						operationName: op.name,
						input: options?.input,
					});
				};
			}
		});

	const internalRequest = async (options: {
		operationName: string;
		input?: any;
		extraHeaders?: { [key: string]: string };
		clientRequest: any;
	}): Promise<any> => {
		const url = `${baseNodeUrl}/internal/${apiName}/${deploymentName}/operations/` + options.operationName;
		const headers = Object.assign(
			{},
			{
				'Content-Type': 'application/json',
				...(options.extraHeaders || {}),
			}
		);
		const res = await axios.post(
			url,
			JSON.stringify({ input: options.input, __wg: { clientRequest: options.clientRequest } }),
			{
				headers,
			}
		);
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
