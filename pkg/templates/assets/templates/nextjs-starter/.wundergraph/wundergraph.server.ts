import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { configureWunderGraphServer } from '@wundergraph/sdk';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		queries: {
			FakeWeather: {
				mockResolve: async (hook) => {
					return {
						data: {
							getCityByName: {
								id: '1',
								name: 'Berlin',
								weather: {
									summary: {
										title: 'Weather for Berlin',
										description: '0°, cloudy',
									},
								},
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
			apiNamespace: 'gql',
			serverName: 'gql',
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
