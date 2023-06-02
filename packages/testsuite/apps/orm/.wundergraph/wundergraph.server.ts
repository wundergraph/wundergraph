import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import { buildSchema, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

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
		{
			serverName: 'echo',
			apiNamespace: 'echo',
			schema: new GraphQLSchema({
				query: new GraphQLObjectType({
					name: 'RootQueryType',
					fields: {
						clientRequestContentLength: {
							type: GraphQLString,
							resolve(obj, args, context, info) {
								return context.wundergraph.clientRequest.headers.get('Content-Length');
							},
						},
					},
				}),
			}),
		},
	],
}));
