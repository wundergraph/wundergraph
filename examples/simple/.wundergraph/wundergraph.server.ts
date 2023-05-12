import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			Countries: {
				preResolve: async ({ operations }) => {},
			},
		},
		mutations: {},
	},
}));
