import { createOperation, z } from '../../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		a: z.number(),
	}),
	handler: async ({ input }) => {
		return {
			b: input.a,
		};
	},
});
