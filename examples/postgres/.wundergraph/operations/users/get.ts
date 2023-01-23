import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ internalClient }) => {
		const users = await internalClient.queries.Users();
		return { ...users.data?.db_findFirstusers };
	},
});
