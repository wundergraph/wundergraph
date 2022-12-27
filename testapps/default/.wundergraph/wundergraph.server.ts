import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import { GithubWebhookVerifier } from '@wundergraph/sdk/dist/webhooks/verifiers';
import { EnvironmentVariable } from '@wundergraph/sdk/dist/configure/variables';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { WebhooksConfig } from './generated/wundergraph.webhooks';
import type { InternalClient } from './generated/wundergraph.internal.client';
import type { GraphQLExecutionContext } from './generated/wundergraph.server';
import {
	buildSchema,
	GraphQLEnumType,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
	GraphQLUnionType,
} from 'graphql';
import { createGraphQLSchema } from 'openapi-to-graphql';
import jsonPlaceholder from './../json_placeholder.json';
import type { SDLResponse } from './generated/models';

export default configureWunderGraphServer<HooksConfig, InternalClient, WebhooksConfig>(() => ({
	webhooks: {
		github: {
			verifier: GithubWebhookVerifier(new EnvironmentVariable('GITHUB_SECRET')),
		},
	},
	hooks: {
		authentication: {
			postAuthentication: async ({ user }) => {},
			mutatingPostAuthentication: async ({ user }) => {
				return {
					user: {
						name: 'John Doe',
					},
					status: 'ok',
				};
			},
			revalidate: async (hook) => {
				return {
					user: {
						name: 'John Doe',
					},
					status: 'ok',
				};
			},
		},
		global: {
			httpTransport: {
				onOriginRequest: {
					enableForAllOperations: true,
					hook: async ({ request }) => {
						console.log('onOriginRequest', request.headers);
						request.headers.set('X-Wundergraph-Test', 'test');
						return request;
					},
				},
				onOriginResponse: {
					enableForAllOperations: true,
					hook: async ({ response }) => {
						console.log('onOriginResponse headers', response.headers);
						return 'skip';
					},
				},
			},
		},
		queries: {
			Albums: {
				preResolve: async (hook) => {
					hook.log.info('preResolve hook for Albums');
				},
				postResolve: async (hook) => {
					hook.log.info('postResolve hook for Albums');
				},
				mutatingPostResolve: async (hook) => {
					hook.log.info('mutatingPostResolve hook for Albums');
					return {
						...hook.response,
					};
				},
				customResolve: async (hook) => {
					hook.log.info('customResolver hook for Albums');
				},
			},
		},
		mutations: {
			SDL: {
				mutatingPreResolve: async (hook) => {
					return hook.input;
				},
				mockResolve: async (hook): Promise<SDLResponse> => {
					return {
						data: null as any,
					};
				},
				postResolve: async (hook) => {},
				customResolve: async (hook) => {},
				mutatingPostResolve: async (hook) => {
					return hook.response;
				},
				preResolve: async (hook) => {},
			},
		},
	},
	graphqlServers: [
		{
			apiNamespace: 'ibm_jsp',
			serverName: 'ibm_jsp',
			// @ts-ignore
			schema: createGraphQLSchema([jsonPlaceholder]).then((r) => r.schema),
		},
		{
			apiNamespace: 'sdl',
			serverName: 'sdl',
			schema: buildSchema(`
                type Query {
                    sdlField(sdl: String!): String!
                }
                type Mutation {
                    setSdlField(sdl: String!): String!
                }
            `),
			customResolverFactory: async (ctx) => {
				return {
					sdlField: (args: any) => 'Hello, ' + args.sdl,
					setSdlField: (args: any) => 'Hello, ' + args.sdl,
				};
			},
		},
		{
			apiNamespace: 'public',
			serverName: 'public',
			enableGraphQLEndpoint: true,
			schema: new GraphQLSchema({
				query: new GraphQLObjectType<any, GraphQLExecutionContext>({
					name: 'Query',
					fields: {
						gqlUnion: {
							args: {
								which: {
									type: new GraphQLNonNull(
										new GraphQLEnumType({
											name: 'Which',
											values: {
												a: {
													value: 'a',
												},
												b: {
													value: 'B',
												},
											},
										})
									),
								},
							},
							type: new GraphQLUnionType({
								name: 'GqlUnion',
								types: [
									new GraphQLObjectType({
										name: 'A',
										fields: {
											id: {
												type: GraphQLString,
											},
											name: {
												type: GraphQLString,
											},
										},
									}),
									new GraphQLObjectType({
										name: 'B',
										fields: {
											id: {
												type: GraphQLString,
											},
											name: {
												type: GraphQLString,
											},
										},
									}),
								],
							}),
							resolve: (obj, args, context, info) => {
								switch (args.which) {
									case 'a':
										return {
											__typename: 'A',
											id: 'a',
											name: 'a',
										};
									case 'B':
										return {
											__typename: 'B',
											id: 'b',
											name: 'b',
										};
								}
							},
						},
					},
				}),
			}),
		},
	],
}));
