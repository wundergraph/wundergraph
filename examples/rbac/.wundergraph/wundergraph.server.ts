import { configureWunderGraphServer } from '@wundergraph/sdk';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';
import type { Role } from './generated/wundergraph.server';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		authentication: {
			/**
			 * mutatingPostResolve is a hook that is called after the user has been authenticate.
			 */
			mutatingPostAuthentication: async ({ user, internalClient, log }) => {
				const roles: Role[] = [];

				const client = internalClient.withHeaders({
					Authorization: `token ${user.rawAccessToken}`,
				});

				const { data } = await client.queries.HasWunderGraphStarred();

				// Only allow the user to access the server if they have starred the repo
				if (
					// Error are communicated via GraphQL unions
					data.github_checkRepoIsStarred.statusCode !== 204
				) {
					log.error(`Could not authorize user ${user.name}`, data.github_checkRepoIsStarred.message);
				} else {
					roles.push('stargazer');
				}

				return {
					status: 'ok',
					user: {
						...user,
						roles,
					},
				};
			},
		},
		mutations: {},
	},
	graphqlServers: [],
}));
