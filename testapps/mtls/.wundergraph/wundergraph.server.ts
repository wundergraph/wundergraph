import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		global: {
			httpTransport: {
				onOriginResponse: {
					enableForAllOperations: true,
					hook: async (hook) => {
						console.log('########onResponse##########', hook);
					},
				},
				onOriginRequest: {
					enableForAllOperations: true,
					hook: async (hook) => {
						console.log('########onRequest##########', hook);
					},
				},
			},
		},
		queries: {
			Dragons: {
				preResolve: async (hook) => {
					console.log('########preResolve##########', hook);
				},
				postResolve: async (hook) => {},
			},
		},
	},
}));
