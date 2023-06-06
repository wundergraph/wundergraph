import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from '../src/lib/.wundergraph/generated/wundergraph.hooks';
import type { InternalClient } from '../src/lib/.wundergraph/generated/wundergraph.internal.client';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {},
		mutations: {},
	},
}));
