import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

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
