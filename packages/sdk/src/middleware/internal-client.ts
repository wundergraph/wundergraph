import axios from 'axios';
import { OperationType, WunderGraphConfiguration } from '@wundergraph/protobuf';

export interface InternalClient {
	queries: {
		[operationName: string]: (input: any) => Promise<any>;
	};
	mutations: {
		[operationName: string]: (input: any) => Promise<any>;
	};
	withHeaders: (headers: { [key: string]: string }) => InternalClient;
}

const hooksToken = `Bearer ${process.env.HOOKS_TOKEN}`;

export const buildInternalClient = (
	config: WunderGraphConfiguration,
	extraHeaders?: { [key: string]: string }
): InternalClient => {
	const client: InternalClient = {
		queries: {},
		mutations: {},
		withHeaders: (headers: { [key: string]: string }) => {
			return buildInternalClient(config, headers);
		},
	};

	const headers = Object.assign(
		{},
		{
			'Content-Type': 'application/json',
			'X-WG-Authorization': hooksToken,
			...(extraHeaders || {}),
		}
	);

	const internalRequest = async (operationName: string, input?: any): Promise<any> => {
		const url = `http://localhost:9991/internal/${config.apiName}/${config.deploymentName}/operations/` + operationName;
		const res = await axios.post(url, JSON.stringify(input || {}), {
			headers,
		});
		return res.data;
	};

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
