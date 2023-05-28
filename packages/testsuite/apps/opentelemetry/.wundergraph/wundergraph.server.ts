import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			Weather: {
				preResolve: async ({ log, context }) => {
					log.info('preResolve hook for Weather');
				},
			},
		},
		mutations: {},
	},
}));
