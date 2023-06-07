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
		queries: {
			NestedUserID: {
				mutatingPostResolve: async ({ response, user }) => {
					response.data!.userId = user?.userId;
					return {
						...response,
					};
				},
			},
		},
		mutations: {},
		authentication: {
			postAuthentication: async (hook) => {},
			mutatingPostAuthentication: async (hook) => {
				if (hook.user.userId === 'notAllowedByPostAuthentication') {
					return {
						status: 'deny',
						message: 'denied by mutatingPostAuthentication',
					};
				}
				if (hook.user.userId === 'expiresIn1Second') {
					return {
						status: 'ok',
						user: {
							...hook.user,
							expires: Date.now() + 1 * 1000,
						},
					};
				}
				if (hook.user.userId === 'expiresNow') {
					return {
						status: 'ok',
						user: {
							...hook.user,
							expires: Date.now() - 1,
						},
					};
				}
				const customClaims = hook.user.customClaims ?? {};
				customClaims.aTestValue = ['anArray'];
				return {
					status: 'ok',
					user: {
						...hook.user,
						customClaims,
						firstName: hook.user.firstName ?? 'mutatingPostAuthentication',
					},
				};
			},
			revalidate: async (hook) => {
				if (hook.user.userId === 'notAllowedByRevalidation') {
					return {
						status: 'deny',
						message: 'denied by revalidate',
					};
				}
				if (hook.user.userId === 'expiresIn1Second') {
					throw new Error('should not need to revalidate');
				}
				if (hook.user.userId === 'expiresNow') {
					return {
						status: 'ok',
						user: {
							...hook.user,
							expires: Date.now() + 60 * 1000,
						},
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
			postLogout: async (hook) => {},
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
