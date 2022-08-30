import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { configureWunderGraphServer } from '@wundergraph/sdk';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';
import type { WebhooksConfig } from './generated/wundergraph.webhooks';

export default configureWunderGraphServer<HooksConfig, InternalClient, WebhooksConfig>(() => ({
	hooks: {
		queries: {
			UserNodes: {
				mutatingPreResolve: async ({ internalClient }) => {
					const user = await internalClient.queries.UserByEmail({
						input: { email: 'jens@wundergraph.com' },
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
