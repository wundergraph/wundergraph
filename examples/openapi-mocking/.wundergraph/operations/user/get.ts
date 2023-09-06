import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		id: z.number(),
	}),
	handler: async ({ input }) => {
		return {
			name: 'Jens',
			bio: 'Founder of WunderGraph',
		};
	},
});
