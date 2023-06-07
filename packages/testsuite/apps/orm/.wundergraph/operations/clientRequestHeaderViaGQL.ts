import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		header: z.string(),
	}),
	handler: async ({ input, operations }) => {
		const result = await operations.query({
			operationName: 'clientRequestHeaderGQL',
			input: {
				header: input.header,
			},
		});
		return {
			header: input.header,
			value: result.data?.echo_clientRequestHeader ?? '',
		};
	},
});
