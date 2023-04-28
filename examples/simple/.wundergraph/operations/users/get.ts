import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		id: z.string(),
	}),
	handler: async ({ input, context }) => {
		context.greet();
		return {
			id: input.id,
			name: 'Jens',
			bio: 'Founder of WunderGraph',
		};
	},
});
