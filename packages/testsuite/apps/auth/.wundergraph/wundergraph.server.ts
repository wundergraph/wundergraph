import {
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
	GraphQLInt,
	GraphQLFloat,
	GraphQLBoolean,
	GraphQLInputObjectType,
	GraphQLNonNull,
} from 'graphql';
import { AuthenticationResponse, configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {},
		mutations: {},
		authentication: {
			postAuthentication: async (hook) => {
				console.log(`postAuthentication: ${JSON.stringify(hook.user)}`);
			},
			mutatingPostAuthentication: async (hook) => {
				console.log(`mutatingPostAuthentication: ${JSON.stringify(hook.user)}`);
				if (hook.user.userId === 'notAllowedByPostAuthentication') {
					return {
						status: 'deny',
						message: 'denied by mutatingPostAuthentication',
					};
				}
				return {
					status: 'ok',
					user: {
						...hook.user,
						firstName: hook.user.firstName ?? 'mutatingPostAuthentication',
					},
				};
			},
			revalidate: async (hook) => {
				console.log(`revalidate: ${JSON.stringify(hook.user)}`);
				if (hook.user.userId === 'notAllowedByRevalidation') {
					return {
						status: 'deny',
						message: 'denied by revalidate',
					};
				}
				return {
					status: 'ok',
					user: {
						...hook.user,
						lastName: hook.user.lastName ?? 'revalidate',
					},
				};
			},
			postLogout: async (hook) => {
				console.log(`postLogout: ${JSON.stringify(hook.user)}`);
			},
		},
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
						struct: {
							args: {
								input: {
									type: new GraphQLInputObjectType({
										name: 'Struct',
										fields: {
											a: { type: new GraphQLNonNull(GraphQLString) },
											b: { type: new GraphQLNonNull(GraphQLString) },
											c: { type: new GraphQLNonNull(GraphQLString) },
										},
									}),
								},
							},
							type: GraphQLString,
							resolve(obj, args, context, info) {
								return `struct: a:${args.input.a} b:${args.input.b} c:${args.input.c}`;
							},
						},
					},
				}),
			}),
		},
	],
}));
