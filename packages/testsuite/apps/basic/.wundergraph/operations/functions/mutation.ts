import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		name: z.string(),
	}),
	handler: async ({ input, operations }) => {
		const { data } = await operations.mutate({
			operationName: 'SetName',
			input: {
				name: input.name,
			},
		});

		return data;
	},
});
