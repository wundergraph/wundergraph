import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		a: z.number(),
		b: z.number(),
	}),
	handler: async ({ input }) => {
		return {
			add: input.a + input.b,
		};
	},
});
