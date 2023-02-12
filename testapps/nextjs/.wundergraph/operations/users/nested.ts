import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		id: z.string(),
	}),
	handler: async (ctx) => {
		return ctx.internalClient.queries.UsersGet({
			input: {
				id: parseInt(ctx.input.id, 10),
			},
		});
	},
});
