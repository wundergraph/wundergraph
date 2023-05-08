import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import { GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql/index';
import { GraphQLExecutionContext } from './generated/wundergraph.server';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			Schema_extensionsExtensionWithHook: {
				mutatingPostResolve: async ({ response }) => {
					return {
						...response,
						data: {
							...response.data,
							spacex_capsule: {
								...response.data?.spacex_capsule,
								myCustomField: 'resolved by mutatingPostResolve hook',
							},
						},
					};
				},
			},
		},
		mutations: {},
	},
	graphqlServers: [
		{
			apiNamespace: 'embedded',
			serverName: 'embedded',
			schema: new GraphQLSchema({
				query: new GraphQLObjectType<any, GraphQLExecutionContext>({
					name: 'Query',
					fields: {
						clientRequestHeader: {
							type: GraphQLString,
							args: {
								header: {
									type: new GraphQLNonNull(GraphQLString),
								},
							},
							resolve: async (parent, args, ctx) => {
								return ctx.wundergraph.clientRequest.headers.get(args.header);
							},
						},
					},
				}),
			}),
		},
	],
}));
