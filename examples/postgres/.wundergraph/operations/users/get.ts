import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ operations }) => {
		const users = await operations.query({
			operationName: 'Users',
		});
		return { ...users.data?.db_findFirstusers };
	},
});
