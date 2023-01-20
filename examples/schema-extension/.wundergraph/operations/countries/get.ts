import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		code: z.string(),
	}),
	handler: async ({ input }) => {
		return {
			code: input.code,
			name: 'India',
			capital: 'New Delhi',
		};
	},
});
