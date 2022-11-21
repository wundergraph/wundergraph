import { configureWunderGraphServer } from '@wundergraph/sdk';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';
import decodeJwt from 'jwt-decode';
export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		queries: {
			Todos: {
				mutatingPostResolve: async (hook) => {
					let authorizationUrl = process.env.HASURA_TOKEN;
					let decodedJwt = decodeJwt(authorizationUrl);
					let xHasuraUserId = decodedJwt['https://hasura.io/jwt/claims']['x-hasura-user-id'];
					let usersTodos = hook.response.data.hasura_todos.filter((todo) => todo.user_id === xHasuraUserId);
					hook.response.data.hasura_todos = usersTodos;
					return hook.response;
				},
			},
		},
		mutations: {},
	},
	graphqlServers: [],
}));
