import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ operations }) => {
		const result = await operations.query({ operationName: 'nested/UserID' });
		return {
			...result,
		};
	},
});
