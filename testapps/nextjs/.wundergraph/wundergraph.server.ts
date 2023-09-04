import { ResponseError } from '@wundergraph/sdk/client';
import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import { GraphQLEnumType, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

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

export class MyContext {
	cleanup() {
		console.log('cleaning up');
	}
	hello() {
		return 'world';
	}
	greet() {
		console.log(`say hello ${this.hello()}`);
	}
}

declare module '@wundergraph/sdk/server' {
	export interface CustomContext {
		request: MyContext;
	}
}

export default configureWunderGraphServer(() => ({
	context: {
		request: {
			create: async () => new MyContext(),
		},
	},
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

					throw new ResponseError({ code: 'my-error', statusCode: 500 });
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
					return {
						data: {
							gql_hello: hook.input.hello,
						},
					};
				},
				customResolve: async (hook) => {},
			},
			FakeWeather: {
				preResolve: async (hook) => {
					const result = await hook.operations.query({
						operationName: 'FakeWeather',
					});

					console.log(result.error);

					if (result.error) {
						throw result.error;
					}
				},
				mockResolve: async (hook) => {
					const randomWeatherDescription = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'windy'];
					const randomTemperatureCelsius = Math.floor(Math.random() * 40) - 20;
					// '0°, cloudy'
					const description = `${randomTemperatureCelsius}°, ${
						randomWeatherDescription[Math.floor(Math.random() * randomWeatherDescription.length)]
					}`;
					return {
						data: {
							getCityByName: {
								id: '1',
								name: 'Berlin',
								weather: {
									summary: {
										title: 'Weather for Berlin',
										description,
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
