import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
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
}));
