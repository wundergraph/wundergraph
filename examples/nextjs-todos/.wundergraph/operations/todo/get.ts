import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		id: z.number(),
	}),
	handler: async ({ input, internalClient }) => {
		const todoResult = await internalClient.queries.Todo({
			input: {
				id: input.id,
			},
		});
		return { ...todoResult, hi: 'hi' };
	},
});
