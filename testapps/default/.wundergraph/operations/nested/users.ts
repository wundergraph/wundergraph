import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		name: z.string(),
	}),
	handler: async ({ input }) => {
		console.log(`test.ts input: ${JSON.stringify(input)}`);
		return {
			users: [
				{
					id: '1',
					name: input.name,
				},
			],
		};
	},
});
