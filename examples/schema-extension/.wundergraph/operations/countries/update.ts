import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.mutation({
	input: z.object({
		code: z.string(),
		name: z.string(),
		capital: z.string(),
	}),
	handler: async ({ input }) => {
		return {
			...input,
		};
	},
});
