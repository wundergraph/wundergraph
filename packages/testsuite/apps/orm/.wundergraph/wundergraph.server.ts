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
				const value = ctx.request.body.__wg.clientRequest.headers['Wg-Test'];
				return {
					sdlField: (args: any) => value,
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
						clientRequestHeader: {
							type: GraphQLString,
							args: {
								header: { type: GraphQLString },
							},
							resolve(obj, args, context, info) {
								return context.wundergraph.clientRequest.headers.get(args.header);
							},
						},
					},
				}),
			}),
		},
	],
}));
