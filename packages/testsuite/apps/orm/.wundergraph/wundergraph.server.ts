import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import { buildSchema } from 'graphql';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {},
		mutations: {},
	},
	graphqlServers: [
		{
			apiNamespace: 'sdl',
			serverName: 'sdl',
			schema: buildSchema(`
                type Query {
                    sdlField(sdl: String!): String!
                }
            `),
			customResolverFactory: async (ctx) => {
				return {
					sdlField: (args: any) => ctx.wundergraph?.clientRequest?.headers.get('Wg-Test') || '',
				};
			},
		},
	],
}));
