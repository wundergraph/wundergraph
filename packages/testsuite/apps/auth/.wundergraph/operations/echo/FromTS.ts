import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		input: z.string(),
	}),
	// Override the default of true
	requireAuthentication: false,
	handler: async ({ input }) => {
		return input.input;
	},
});
