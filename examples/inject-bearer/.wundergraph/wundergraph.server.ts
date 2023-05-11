import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	hooks: {
		global: {
			httpTransport: {
				onOriginRequest: {
					enableForAllOperations: true,
					hook: async ({ request, user }) => {
						if (user && user.rawIdToken) {
							request.headers.set('Authorization', `Bearer ${user.rawIdToken}`);
						}
						return request;
					},
				},
			},
		},
		queries: {},
		mutations: {},
	},
	graphqlServers: [],
}));
