import { z } from 'zod';
import { createOperation } from '../../wundergraph.operations';

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
