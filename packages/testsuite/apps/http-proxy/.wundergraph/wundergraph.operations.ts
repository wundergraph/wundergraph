import { configureWunderGraphOperations, enableCaching } from '@wundergraph/sdk';
import type { OperationsConfiguration } from './generated/wundergraph.operations';
import type { InternalClient } from './generated/wundergraph.internal.client';
import type { UserRole } from './generated/client';

export default configureWunderGraphOperations<OperationsConfiguration>({
	operations: {
		defaultConfig: {
			authentication: {
				required: false,
			},
		},
		queries: (config) => ({
			...config,
			caching: {
				enable: false,
				staleWhileRevalidate: 60,
				maxAge: 60,
				public: true,
			},
			liveQuery: {
				enable: true,
				pollingIntervalSeconds: 1,
			},
		}),
		mutations: (config) => ({
			...config,
		}),
		subscriptions: (config) => ({
			...config,
		}),
		custom: {},
	},
});
