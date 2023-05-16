import { configureWunderGraphOperations, enableCaching } from '@wundergraph/sdk';

export default configureWunderGraphOperations({
	operations: {
		defaultConfig: {
			authentication: {
				required: false,
			},
		},
		queries: (config) => ({
			...config,
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
			CountryByFilter: (config) => {
				config.caching = {
					maxAge: 0,
					staleWhileRevalidate: 0,
					mustRevalidate: false,
				};
				return config;
			},
			With_hyphenCountry_code_with_hyphen: (config) => {
				config.caching = {
					maxAge: 0,
					staleWhileRevalidate: undefined,
				};
				return config;
			},
		},
	},
});
