import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.mutation({
	input: z.object({
		id: z.string(),
		name: z.string(),
		bio: z.string().optional(),
	}),
	handler: async (ctx) => {
		return {
			id: ctx.input.id,
			userName: ctx.input.name,
			bio: ctx.input.bio || 'Founder of WunderGraph',
		};
	},
});
