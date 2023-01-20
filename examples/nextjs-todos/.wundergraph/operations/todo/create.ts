import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.mutation({
	input: z.object({
		title: z.string(),
	}),
	handler: async ({ input, internalClient }) => {
		return await internalClient.mutations.CreateTodo({
			input: {
				title: input.title,
			},
		});
	},
});
