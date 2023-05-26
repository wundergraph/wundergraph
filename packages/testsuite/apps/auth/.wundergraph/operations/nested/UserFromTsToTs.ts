import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ operations }) => {
		const result = await operations.query({ operationName: 'claims/User' });
		return {
			...result,
		};
	},
});
