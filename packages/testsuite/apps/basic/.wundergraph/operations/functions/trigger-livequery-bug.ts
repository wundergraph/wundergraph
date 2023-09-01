import { createOperation, z } from '../../generated/wundergraph.factory';

let counter = 0;

export default createOperation.query({
	input: z.object({
		reset: z.boolean().optional(),
		output: z.boolean().optional(),
	}),
	live: {
		enable: true,
		pollingIntervalSeconds: 1,
	},
	handler: async ({ input }) => {
		if (input?.reset ?? false) {
			counter = 0;
		}
		if (input?.output ?? false) {
			return `${counter}`;
		}
		counter++;
		return 'no output';
	},
});
