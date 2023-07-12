import { configureWunderGraphServer } from '@wundergraph/sdk/server';

import config from './wundergraph.config';

export default configureWunderGraphServer(() => ({
	integrations: config.integrations,
	hooks: {
		queries: {
			Weather: {
				preResolve: async ({ log, context }) => {
					log.info('preResolve hook for Weather');
				},
			},
		},
	},
}));
