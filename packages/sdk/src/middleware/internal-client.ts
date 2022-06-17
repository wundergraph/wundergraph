import axios from 'axios';
import { Operation, OperationType } from '@wundergraph/protobuf';

interface ClientRequestContext {
	// used as "context" in operation methods to access request based properties
	__wg: {
		extraHeaders?: { [key: string]: string };
		clientRequest?: any;
	};
}
interface Operations {
	queries: {
		[operationName: string]: any;
	} & ClientRequestContext;
	mutations: {
		[operationName: string]: any;
	} & ClientRequestContext;
}

export interface BaseInternalClient {
	queries: {
		[operationName: string]: (input: any) => Promise<any>;
	};
	mutations: {
		[operationName: string]: (input: any) => Promise<any>;
	};
}

export interface InternalClient extends BaseInternalClient {
	withHeaders: (headers: { [key: string]: string }) => InternalClient;
}

const hooksToken = `Bearer ${process.env.HOOKS_TOKEN}`;

export interface InternalClientFactory {
	(extraHeaders?: { [p: string]: string } | undefined, clientRequest?: any): InternalClient;
}

// internalClientFactory is a factory function that creates an internal client.
// this function should be only called once on startup.
export const internalClientFactory = (
	apiName: string,
	deploymentName: string,
	operations: Operation[]
): InternalClientFactory => {
	const baseOperations: Operations = {
		queries: {
			__wg: {
				clientRequest: {},
				extraHeaders: {},
			},
		},
		mutations: {
			__wg: {
				clientRequest: {},
				extraHeaders: {},
			},
		},
	};

	operations
		.filter((op) => op.operationType == OperationType.QUERY)
		.forEach((op) => {
			if (baseOperations.queries) {
				baseOperations.queries[op.name] = async function (this: ClientRequestContext, input?: any) {
					return internalRequest({
						extraHeaders: this.__wg.extraHeaders,
						clientRequest: this.__wg.clientRequest,
						operationName: op.name,
						input,
					});
				};
			}
		});

	operations
		.filter((op) => op.operationType == OperationType.MUTATION)
		.forEach((op) => {
			if (baseOperations.mutations) {
				baseOperations.mutations[op.name] = async function (this: ClientRequestContext, input?: any) {
					return internalRequest({
						extraHeaders: this.__wg.extraHeaders,
						clientRequest: this.__wg.clientRequest,
						operationName: op.name,
						input,
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
		const url = `http://localhost:9991/internal/${apiName}/${deploymentName}/operations/` + options.operationName;
		const headers = Object.assign(
			{},
			{
				'Content-Type': 'application/json',
				'X-WG-Authorization': hooksToken,
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
	return function build(extraHeaders?: { [key: string]: string }, clientRequest?: any): InternalClient {
		// let's inherit the base operation methods from the base client
		// but create a new object to avoid mutating the base client
		const operations: Operations = {
			queries: Object.create(baseOperations.queries),
			mutations: Object.create(baseOperations.mutations),
		};

		// Set new context for each new client instance.
		// Assign request variables to the query/mutation object
		// so that every operation has access through "this" to __wg
		operations.queries.__wg = {
			clientRequest,
			extraHeaders,
		};
		operations.mutations.__wg = {
			clientRequest,
			extraHeaders,
		};

		const client: InternalClient = {
			queries: operations.queries,
			mutations: operations.mutations,
			withHeaders: (headers: { [key: string]: string }) => {
				return build(headers, clientRequest);
			},
		};

		return client;
	};
};
