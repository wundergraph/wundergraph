import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { Role } from './generated/wundergraph.server';

export default configureWunderGraphServer(() => ({
	hooks: {
		authentication: {
			/**
			 * mutatingPostResolve is a hook that is called after the user has been authenticate.
			 */
			mutatingPostAuthentication: async ({ user, operations, log }) => {
				const roles: Role[] = [];

				const client = operations.withHeaders({
					Authorization: `token ${user.rawAccessToken}`,
				});

				const { data } = await client.query({
					operationName: 'HasWunderGraphStarred',
				});

				// Only allow the user to access the server if they have starred the repo
				if (
					// Error are communicated via GraphQL unions
					data?.github_checkRepoIsStarred?.statusCode !== 204
				) {
					log.error(`Could not authorize user ${user.name}`, data?.github_checkRepoIsStarred?.message);
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
