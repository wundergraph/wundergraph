import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	hooks: {
		global: {
			wsTransport: {
				onConnectionInit: {
					// counter is the id of the introspected api (data source id), defined in the wundergraph.config.ts
					enableForDataSources: ['counter'],
					hook: async (hook) => {
						let token = hook.clientRequest.headers.get('Authorization') || '';
						// we can have a different logic for each data source
						if (hook.dataSourceId === 'counter') {
							token = 'secret';
						}
						return {
							// this payload will be passed to the ws `connection_init` message payload
							// {"type": "connection_init", "payload": {"Authorization": "secret"}}
							payload: {
								Authorization: token,
							},
						};
					},
				},
			},
		},
		queries: {},
		mutations: {},
		subscriptions: {
			// .wundergraph/operations/Ws.graphql
			Ws: {
				mutatingPreResolve: async (hook) => {
					// here we modify the input before request is sent to the data source
					hook.input.from = 7;
					return hook.input;
				},
				postResolve: async (hook) => {
					// here we log the response we got from the ws server (not the modified one)
					hook.log.info(`postResolve hook: ${hook.response.data!.ws_countdown}`);
				},
				mutatingPostResolve: async (hook) => {
					// here we modify the response before it gets sent to the client
					let count = hook.response.data!.ws_countdown!;
					count++;
					hook.response.data!.ws_countdown = count;
					return hook.response;
				},
				preResolve: async (hook) => {
					// here we log the request input
					/**
					 * // .wundergraph/operations/Ws.graphql
					 * subscription($from: Int!) {
					 * 	ws_countdown(from: $from)
					 * }
					 */
					hook.log.info(`preResolve hook input, counter starts from: ${hook.input.from}`);
				},
			},
		},
	},
	graphqlServers: [],
}));
