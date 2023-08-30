import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.mutation({
	input: z.object({
		title: z.string(),
	}),
	handler: async ({ input, operations }) => {
		return await operations.mutate({
			operationName: 'CreateTodo',
			input: {
				title: input.title,
				order: 0,
			},
		});
	},
});
