import { configureWunderGraphServer } from '@wundergraph/sdk';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		global: {
			httpTransport: {
				onOriginRequest: {
					enableForAllOperations: true,
					hook: async ({ request, user }) => {
						return {
							...request,
							headers: {
								...request.headers,
								Authorization: `Bearer ${user.accessToken}`,
							},
						};
					},
				},
			},
		},
		queries: {},
		mutations: {},
	},
	graphqlServers: [],
}));
