import axios from 'axios';
import { OperationType, WunderGraphConfiguration } from '@wundergraph/protobuf';

export interface BaseInternalClient {
	queries: {
		[operationName: string]: (input: any) => Promise<any>;
	};
	mutations: {
		[operationName: string]: (input: any) => Promise<any>;
	};
	extraHeaders?: { [key: string]: string };
}

export interface InternalClient extends BaseInternalClient {
	withHeaders: (headers: { [key: string]: string }) => InternalClient;
}

const hooksToken = `Bearer ${process.env.HOOKS_TOKEN}`;

export interface InternalClientFactory {
	(extraHeaders?: { [p: string]: string } | undefined, clientRequest?: any): InternalClient;
}

export const internalClientFactory = (config: WunderGraphConfiguration): InternalClientFactory => {
	return function build(extraHeaders?: { [key: string]: string }, clientRequest?: any): InternalClient {
		const client: InternalClient = {
			queries: {},
			mutations: {},
			withHeaders: (headers: { [key: string]: string }) => {
				return build(headers, clientRequest);
			},
		};

		const internalRequest = async (operationName: string, input?: any): Promise<any> => {
			const url =
				`http://localhost:9991/internal/${config.apiName}/${config.deploymentName}/operations/` + operationName;
			const headers = Object.assign(
				{},
				{
					'Content-Type': 'application/json',
					'X-WG-Authorization': hooksToken,
					...(extraHeaders || {}),
				}
			);
			const res = await axios.post(url, JSON.stringify({ input, __wg: { client_request: clientRequest } }), {
				headers,
			});
			return res.data;
		};

		// set operations

		config.api?.operations
			.filter((op) => op.operationType == OperationType.QUERY)
			.forEach((op) => {
				if (client.queries) {
					client.queries[op.name] = (input?: any) => internalRequest(op.name, input);
				}
			});

		config.api?.operations
			.filter((op) => op.operationType == OperationType.MUTATION)
			.forEach((op) => {
				if (client.mutations) {
					client.mutations[op.name] = (input?: any) => internalRequest(op.name, input);
				}
			});

		return client;
	};
};
