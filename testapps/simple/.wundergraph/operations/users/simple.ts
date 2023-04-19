import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	// input: z.object({
	// 	name: z.string(),
	// }),
	// input: z.string(),
	handler: async ({ operations /* input */ }) => {
		// operations.query({
		// 	operationName: 'users/simple'
		// })
		// input.name
		return 'hello simple';
	},
});
