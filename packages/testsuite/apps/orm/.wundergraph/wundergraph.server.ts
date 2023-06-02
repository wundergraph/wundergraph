import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {},
		mutations: {},
	},
	graphqlServers: [
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
