import { createOperation, z } from '../generated/wundergraph.factory';

const query = createOperation.query({
	response: z.object({
		id: z.number(),
		userName: z.string(),
		bio: z.string().optional(),
	}),
	handler: async (ctx) => {
		return {
			id: ctx.input.id,
			userName: 'Jens Neuse',
			bio: 'Founder of WunderGraph',
		};
	},
});

export default query;
