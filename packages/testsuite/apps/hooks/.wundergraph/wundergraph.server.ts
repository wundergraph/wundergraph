import { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean } from 'graphql';

import { configureWunderGraphServer } from '@wundergraph/sdk/server';

const logPreResolve = async (hook: any) => {
	console.log(`preResolve: ${JSON.stringify(hook)}`);
};

const logMutatingPreResolve = async (hook: any) => {
	console.log(`mutatingPreResolve: ${JSON.stringify(hook)}`);
};

const logCustomResolve = async (hook: any) => {
	console.log(`customResolve: ${JSON.stringify(hook)}`);
};

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			Infinite: {
				preResolve: async (hook) => {
					logPreResolve(hook);
					const result = await hook.internalClient.queries.Infinite({
						input: hook.input,
					});

					const result2 = await hook.operations.query({
						operationName: 'Infinite',
						input: hook.input,
					});
				},
			},
			PreResolveFailure: {
				preResolve: async (hook) => {
					logPreResolve(hook);
					throw new Error('stop');
				},
			},
			MockResolve: {
				mockResolve: async (hook) => {
					return {
						data: {
							echo_string: hook.input.s + '.mockResolve',
						},
					};
				},
			},
			MutatingPostResolve: {
				mockResolve: async (hook) => {
					return {
						data: {
							echo_string: hook.input.s + '.mockResolve',
						},
					};
				},
				mutatingPostResolve: async (hook) => {
					return {
						data: {
							echo_string: hook.response.data?.echo_string + '.mutatingPostResolve',
						},
					};
				},
			},
			MutatingPreResolveFailure: {
				preResolve: logPreResolve,
				mutatingPreResolve: async (hook) => {
					logMutatingPreResolve(hook);
					throw new Error('stop');
				},
			},
			CustomResolveFailure: {
				preResolve: logPreResolve,
				customResolve: async (hook) => {
					logCustomResolve(hook);
					throw new Error('stop');
				},
			},
			CustomResolve: {
				customResolve: async (hook) => {
					return {
						data: {
							echo_string: 'customResolved',
						},
					};
				},
			},
			CustomResolveSkip: {
				customResolve: async (hook) => {
					return null;
				},
			},
			PreResolveChain: {
				preResolve: logPreResolve,
				mutatingPreResolve: async (hook) => {
					logMutatingPreResolve(hook);
					return {
						s: hook.input.s + '.mutatingPreResolve',
					};
				},
				mockResolve: async (hook) => {
					console.log(`mockResolve: ${hook.input}`);
					return {
						data: {
							echo_string: hook.input.s + '.mockResolve',
						},
					};
				},
			},
			RecursiveContinents: {
				customResolve: async (hook) => {
					return hook.operations.query({
						operationName: 'Continents',
					});
				},
			},
			Continents: {
				customResolve: async () => {
					return {
						data: {
							countries_continents: [
								{
									code: 'FK',
									name: 'Fake',
								},
							],
						},
					};
				},
			},
		},
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
						boolean: {
							args: {
								input: { type: GraphQLBoolean },
							},
							type: GraphQLString,
							resolve(obj, args, context, info) {
								return `boolean: ${args.input}`;
							},
						},
						int: {
							args: {
								input: { type: GraphQLInt },
							},
							type: GraphQLString,
							resolve(obj, args, context, info) {
								return `int: ${args.input}`;
							},
						},
						float: {
							args: {
								input: { type: GraphQLFloat },
							},
							type: GraphQLString,
							resolve(obj, args, context, info) {
								return `float: ${args.input}`;
							},
						},
						string: {
							args: {
								input: { type: GraphQLString },
							},
							type: GraphQLString,
							resolve(obj, args, context, info) {
								return `string: ${args.input}`;
							},
						},
					},
				}),
			}),
		},
	],
}));
