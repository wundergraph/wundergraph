import { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean } from 'graphql';

import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		queries: {
			PreResolveFailure: {
				preResolve: async (hook) => {
					console.log(`preResolve: ${hook.input}`);
					throw new Error('stop');
				},
			},
			PreResolveChain: {
				preResolve: async (hook) => {
					console.log(`preResolve: ${hook.input}`);
				},
				mutatingPreResolve: async (hook) => {
					console.log(`mutatingPreResolve: ${hook.input}`);
					return {
						s: hook.input.s + '.mutatingPreResolve',
					};
				},
			},
			RecursiveContinents: {
				customResolve: async (hook) => {
					console.log('CUSTOM RESOLVE - RecursiveContinents');
					return hook.internalClient.queries.Continents();
				},
			},
			Continents: {
				customResolve: async () => {
					console.log('CUSTOM RESOLVE - Continents');
					return {
						data: {
							countries_continents: [
								{
									code: '123',
									name: 'abc',
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
