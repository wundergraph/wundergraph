import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		seconds: z.number(),
	}),
	handler: async ({ input }) => {
		const start = new Date().toISOString();
		await new Promise((resolve) => setTimeout(resolve, input.seconds * 1000));
		const end = new Date().toISOString();

		return {
			seconds: input.seconds,
			start,
			end,
		};
	},
});
