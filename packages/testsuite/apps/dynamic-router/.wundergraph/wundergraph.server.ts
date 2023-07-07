import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	hooks: {
		global: {
			httpTransport: {
				onOriginTransport: {
					hook: async ({ request }) => {
						return fetch(request);
					},
					enableForAllOperations: true,
				},
			},
		},
		queries: {},
		mutations: {},
	},
}));
