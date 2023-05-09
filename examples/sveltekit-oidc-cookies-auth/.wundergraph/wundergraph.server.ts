import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';


export default configureWunderGraphServer(() => ({
	hooks: {
		authentication: {
			async mutatingPostAuthentication({internalClient, user}){						
				if(!user.email) {
					return {
						status: 'deny',
						message: 'Email is required'
					}
				}
				const {data, errors} = await internalClient.mutations.UserAdd({
					input: {
						email: user.email as string,
						firstName: user.firstName ? user.firstName : '',
						lastName: user.lastName ? user.lastName : '',
						name: user.name ? user.name : '',
						picture: user.picture ? user.picture : ''
					}
				})

				if(errors || !data?.db_upsertOneUser?.id) {
					return {
						status: 'deny',
						message: 'Error creating the user'
					}
				}
				return {
					status: 'ok',
					user: data.db_upsertOneUser
				}
			},
		},
		queries: {},
		mutations: {
			
		},
	},
}));
