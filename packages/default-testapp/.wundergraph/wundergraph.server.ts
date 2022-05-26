import { configureWunderGraphServer } from '@wundergraph/sdk';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';
import type { GraphQLExecutionContext } from './generated/wundergraph.server';
import {
	buildSchema,
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
	GraphQLUnionType,
} from 'graphql';
import { createGraphQLSchema } from 'openapi-to-graphql';
import jsonPlaceholder from './../json_placeholder.json';

export default configureWunderGraphServer<HooksConfig, InternalClient>((serverContext) => ({
	hooks: {
		global: {
			httpTransport: {
				onRequest: {
					hook: async (ctx, request) => {
						return {
							...request,
						};
					},
				},
			},
		},
		queries: {
			Dragons: {
				preResolve: async (ctx) => {
					ctx.log.info(`preResolve_clientRequest: ${JSON.stringify(ctx.clientRequest)}`);
				},
			},
		},
	},
	graphqlServers: [
		{
			apiNamespace: 'jsp',
			serverName: 'jsp',
			schema: createGraphQLSchema([jsonPlaceholder]).then((r) => r.schema),
		},
		{
			apiNamespace: 'sdl',
			serverName: 'sdl',
			schema: buildSchema(`
                type Query {
                    sdlField: String!
                }
                type Mutation {
                    setSdlField(sdl: String!): String!
                }
            `),
			customResolverFactory: async (ctx) => {
				return {
					sdlField: () => 'Hello World',
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
						dragons: {
							type: new GraphQLList(
								new GraphQLObjectType({
									name: 'Dragon',
									fields: {
										name: {
											type: GraphQLString,
										},
										crewCapacity: {
											type: GraphQLInt,
										},
										active: {
											type: GraphQLBoolean,
										},
										posts: {
											type: new GraphQLList(
												new GraphQLObjectType({
													name: 'Post',
													fields: {
														id: {
															type: GraphQLInt,
														},
														title: {
															type: GraphQLString,
														},
													},
												})
											),
										},
									},
								})
							),
							async resolve(root, args, ctx, info) {
								ctx.log.info(`resolve_client_request: ${JSON.stringify(ctx.requestContext.clientRequest)}`);
								const data = await serverContext.internalClient.queries.InternalDragons();
								const posts = await serverContext.internalClient.queries.JSP();
								return data.data?.spacex_dragons?.map((d) => ({
									name: d.name,
									crewCapacity: d.crew_capacity,
									active: d.active,
									posts: posts.data?.jsp_postsList?.map((p) => ({
										id: p.id,
										title: p.title,
									})),
								}));
							},
						},
					},
				}),
			}),
		},
	],
}));
