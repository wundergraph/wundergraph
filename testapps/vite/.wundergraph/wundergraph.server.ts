import { GraphQLEnumType, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

const testEnum = new GraphQLEnumType({
	name: 'TestEnum',
	values: {
		EnumValueA: {
			value: 'EnumValueA',
		},
		EnumValueB: {
			value: 'EnumValueA',
		},
	},
});

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		authentication: {
			mutatingPostAuthentication: async (hook) => {
				return {
					status: 'ok',
					user: {
						...hook.user,
						roles: ['user', 'admin'],
					},
				};
			},
		},
		queries: {
			Hello: {
				preResolve: async (hook) => {
					console.log('###preResolve', hook);
				},
				mutatingPreResolve: async (hook) => {
					console.log('###mutatingPreResolve', hook);
					return hook.input;
				},
				postResolve: async (hook) => {
					console.log('###postResolve', hook);
				},
				mutatingPostResolve: async (hook) => {
					console.log('###mutatingPostResolve', hook);
					return hook.response;
				},
			},
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
		mutations: {
			SetName: {
				preResolve: async (hook) => {
					console.log('###preResolve', hook);
				},
				mutatingPreResolve: async (hook) => {
					console.log('###mutatingPreResolve', hook);
					return hook.input;
				},
				postResolve: async (hook) => {
					console.log('###postResolve', hook);
				},
				mutatingPostResolve: async (hook) => {
					console.log('###mutatingPostResolve', hook);
					return hook.response;
				},
			},
		},
	},
	graphqlServers: [
		{
			apiNamespace: 'gql',
			serverName: 'gql',
			schema: new GraphQLSchema({
				query: new GraphQLObjectType({
					name: 'Query',
					fields: {
						hello: {
							type: GraphQLString,
							args: {
								name: {
									type: new GraphQLNonNull(GraphQLString),
								},
							},
							resolve(root, args) {
								return args.name + 'world';
							},
						},
						testField: {
							type: new GraphQLObjectType({
								name: 'TestResponse',
								fields: {
									enumList: {
										type: new GraphQLNonNull(new GraphQLList(testEnum)),
									},
									stringList: {
										type: new GraphQLList(GraphQLString),
									},
								},
							}),
							args: {
								inputEnum: {
									type: new GraphQLNonNull(new GraphQLList(testEnum)),
								},
							},
							resolve: (source, args, context, info) => {
								return {
									enumList: args.inputEnum,
									stringList: ['a', 'b', 'c'],
								};
							},
						},
					},
				}),
				mutation: new GraphQLObjectType<any, any>({
					name: 'Mutation',
					fields: {
						setName: {
							type: GraphQLString,
							args: {
								name: {
									type: new GraphQLNonNull(GraphQLString),
								},
							},
							resolve: async (source, args, context, info) => {
								console.log(JSON.stringify({ setName: args }));
								return args.name;
							},
						},
					},
				}),
			}),
		},
	],
}));
