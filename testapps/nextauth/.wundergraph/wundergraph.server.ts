import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		authentication: {
			postAuthentication: async (hook) => {
				console.log(hook);
			},
		},
		queries: {
			Dragons: {
				preResolve: async (props) => {
					console.log(props);
				},
			},
		},
		mutations: {
			SetName: {
				mockResolve: async (hook) => {
					return {
						data: {
							setName: hook.input.name,
						},
					};
				},
			},
		},
	},
	graphqlServers: [],
}));
