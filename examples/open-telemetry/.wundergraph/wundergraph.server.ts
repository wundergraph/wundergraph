import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			Continents: {
				preResolve: async ({ log }) => {
					log.info('preResolve');
				},
			},
		},
		mutations: {},
	},
}));
