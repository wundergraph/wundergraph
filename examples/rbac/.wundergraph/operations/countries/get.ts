import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		code: z.string(),
	}),
	rbac: {
		requireMatchAll: ['stargazer'],
	},
	handler: async ({ input }) => {
		return {
			code: input.code,
			name: 'India',
			capital: 'New Delhi',
		};
	},
});
