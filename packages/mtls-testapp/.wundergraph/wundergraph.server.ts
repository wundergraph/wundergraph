import { configureWunderGraphServer } from '@wundergraph/sdk';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		global: {
			httpTransport: {
				onOriginResponse: {
					enableForAllOperations: true,
					hook: async (hook) => {
						console.log('########onResponse##########', hook.clientRequest);
					},
				},
				onOriginRequest: {
					enableForAllOperations: true,
					hook: async (hook) => {
						console.log('########onRequest##########', hook.clientRequest.method);
					},
				},
			},
		},
	},
}));
