import { GraphQLEnumType, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { configureWunderGraphServer } from '@wundergraph/sdk';
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
				console.log('mutatingPostAuthentication', JSON.stringify(hook.user));
				return {
					status: 'ok',
					user: {
						...hook.user,
						roles: ['user', 'admin'],
					},
				};
			},
			postLogout: async (hook) => {
				console.log('postLogout', JSON.stringify(hook.user));
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
		subscriptions: {
			// .wundergraph/operations/Counter.graphql
			// Counter: {
			// 	mutatingPreResolve: async (hook) => {
			// 		// here we modify the input before request is sent to the data source
			// 		hook.input.from = 7;
			// 		return hook.input;
			// 	},
			// 	postResolve: async (hook) => {
			// 		// here we log the response we got from the ws server (not the modified one)
			// 		hook.log.info(`postResolve hook: ${hook.response.data!.countdown}`);
			// 	},
			// 	mutatingPostResolve: async (hook) => {
			// 		// here we modify the response before it gets sent to the client
			// 		let count = hook.response.data!.countdown!;
			// 		count++;
			// 		hook.response.data!.countdown = count;
			// 		return hook.response;
			// 	},
			// 	preResolve: async (hook) => {
			// 		// here we log the request input
			// 		/**
			// 		 * // .wundergraph/operations/Ws.graphql
			// 		 * subscription($from: Int!) {
			// 		 * 	ws_countdown(from: $from)
			// 		 * }
			// 		 */
			// 		hook.log.info(`preResolve hook input, counter starts from: ${hook.input.from}`);
			// 	},
			// },
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
