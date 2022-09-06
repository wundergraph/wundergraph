import { configureWunderGraphOperations } from '@wundergraph/sdk';
import type { OperationsConfiguration } from './generated/wundergraph.operations';

export default configureWunderGraphOperations<OperationsConfiguration>({
	operations: {
		defaultConfig: {
			authentication: {
				required: false,
			},
		},
		mutations: (config) => {
			return config;
		},
		subscriptions: (config) => {
			return config;
		},
		queries: (config) => ({
			...config,
			liveQuery: {
				enable: false,
				pollingIntervalSeconds: 0,
			},
			caching: {
				enable: false,
				staleWhileRevalidate: 60,
				maxAge: 60,
				public: true,
			},
		}),
		custom: {
			Dragons: (config) => ({
				...config,
				caching: {
					...config.caching,
					enable: true,
				},
			}),
		},
	},
});
