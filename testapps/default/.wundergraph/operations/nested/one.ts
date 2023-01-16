import { z } from 'zod';
import { createOperation } from '../../wundergraph.operations';

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
