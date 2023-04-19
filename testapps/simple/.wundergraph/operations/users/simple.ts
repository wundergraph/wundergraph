import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.array(z.string()),
	handler: async ({ operations, input }) => {
		return 'hello simple';
	},
});
