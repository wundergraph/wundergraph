import { createOperation, z, AuthorizationError } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		id: z.number(),
	}),
	handler: async (ctx) => {
		return {
			id: ctx.input.id,
			userName: 'Jens Neuse',
			bio: 'Founder of WunderGraph',
		};
	},
});
