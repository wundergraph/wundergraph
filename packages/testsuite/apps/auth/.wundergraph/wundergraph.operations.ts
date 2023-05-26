import { BaseOperationConfiguration, configureWunderGraphOperations } from '@wundergraph/sdk';

export default configureWunderGraphOperations({
	operations: {
		defaultConfig: {
			authentication: {
				required: true,
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
		custom: {
			NestedUserID: (config: BaseOperationConfiguration) => {
				config.authentication = {
					required: true,
				};
				return config;
			},
			EchoStringWithRequiredAuthentication: (config: BaseOperationConfiguration) => {
				config.authentication = {
					required: false,
				};
				return config;
			},
			EchoStringWithoutRequiredAuthentication: (config: BaseOperationConfiguration) => {
				config.authentication = {
					required: false,
				};
				return config;
			},
		},
	},
});
