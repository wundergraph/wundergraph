import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		id: z.number(),
	}),
	handler: async ({ input, operations }) => {
		const todoResult = await operations.query({
			operationName: 'Todo',
			input: {
				id: input.id,
			},
		});
		return { ...todoResult, hi: 'hi' };
	},
});
