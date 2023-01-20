import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		id: z.string(),
	}),
	handler: async ({ input }) => {
		return {
			upc: input.id,
			name: 'Table',
			price: 899,
			weight: 100,
		};
	},
});
