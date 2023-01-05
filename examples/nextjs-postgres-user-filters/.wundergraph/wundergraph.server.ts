import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		queries: {
			UserNodes: {
				mutatingPreResolve: async ({ internalClient }) => {
					const user = await internalClient.queries.UserByEmail({
						input: {
							email: 'jens@wundergraph.com',
						},
					});
					return {
						where: {
							created_at: {
								gt: user.data.db_findFirstUser.Filter.node_created_after,
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
