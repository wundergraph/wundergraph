import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			Dragons: {
				/**
				 * mutatingPostResolve is a hook that is called after the query has been resolved.
				 * It can be used to alter the response .
				 */
				mutatingPostResolve: async ({ user, response, clientRequest }) => {
					console.log('mutatingPostResolve', clientRequest.requestURI);
					return {
						data: {
							spacex_dragons: [
								{
									name: 'Custom Falcon 9',
									active: true,
								},
								...(response.data?.spacex_dragons ?? []),
							],
						},
					};
				},
			},
		},
		mutations: {},
	},
	graphqlServers: [],
}));
