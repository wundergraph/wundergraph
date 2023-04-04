import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		global: {
			httpTransport: {
				onOriginRequest: {
					enableForAllOperations: true,
					hook: async (hook) => {
						hook.log('########onRequest##########');

						return hook.request;
					},
				},
			},
		},
		queries: {
			Dragons: {
				preResolve: async (hook) => {
					hook.log.info('preResolve hook for Dragons');
				},
				postResolve: async (hook) => {
					hook.log.info('postResolve hook for Dragons');
				},
				mutatingPostResolve: async (hook) => {
					hook.log.info('mutatingPostResolve hook for Dragons');
					return {
						...hook.response,
					};
				},
				customResolve: async (hook) => {
					hook.log.info('customResolver hook for Dragons');
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
