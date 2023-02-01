import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.mutation({
	input: z.object({
		x: z.number(),
	}),
	handler: async ({ input, operations }) => {
		return {
			z: input.x,
		};
	},
});
