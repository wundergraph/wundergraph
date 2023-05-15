import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			UserNodes: {
				mutatingPreResolve: async ({ input, internalClient }) => {
					const user = await internalClient.queries.UserByEmail({
						input: {
							email: 'jens@wundergraph.com',
						},
					});
					return {
						where: {
							...input.where,
							created_at: {
								gt: user.data?.db_findFirstUser?.Filter?.node_created_after,
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
			serverName: 'gql',
			apiNamespace: 'gql',
			schema: new GraphQLSchema({
				query: new GraphQLObjectType({
					name: 'RootQueryType',
					fields: {
						hello: {
							type: GraphQLString,
							resolve() {
								return 'world';
							},
						},
					},
				}),
			}),
		},
	],
}));
