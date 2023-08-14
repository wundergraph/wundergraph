import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { Role } from './generated/wundergraph.server';

export default configureWunderGraphServer(() => ({
	hooks: {
		authentication: {
			/**
			 * mutatingPostResolve is a hook that is called after the user has been authenticated.
			 */
			mutatingPostAuthentication: async ({ user}) => {
				const allowedRolesClaim = 'x-wundergraph-allowed-roles';
				
				const roles: Role[] = [];

				if (user.rawAccessToken) {
					// Check if the custom claim exists in the JWT
					if (allowedRolesClaim in user.rawAccessToken) {
						const rolesClaim = user.rawAccessToken[allowedRolesClaim];

						// Ensure the roles claim is an array
						if (Array.isArray(rolesClaim)) {
							// Add the roles from the claim to the user's roles
							roles.push(...rolesClaim);
						}
					}
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
