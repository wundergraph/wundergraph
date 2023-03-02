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
import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		queries: {},
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
