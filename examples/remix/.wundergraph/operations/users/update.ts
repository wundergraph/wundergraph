import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.mutation({
	input: z.object({
		id: z.string(),
		name: z.string(),
		bio: z.string(),
	}),
	requireAuthentication: true,
	handler: async ({ input }) => {
		return {
			...input,
		};
	},
});
