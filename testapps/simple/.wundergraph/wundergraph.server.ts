import { configureWunderGraphServer } from '@wundergraph/sdk/server';

import config from './wundergraph.config';

export default configureWunderGraphServer(() => ({
	integrations: config.integrations,
	hooks: {
		queries: {
			Weather: {
				preResolve: async (hook) => {
					hook.log.info('preResolve hook for Weather');
				},
			},
		},
		mutations: {},
	},
	graphqlServers: [],
}));
