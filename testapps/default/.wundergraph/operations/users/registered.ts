import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
	input: z.object({
		a: z.number(),
	}),
	handler: async function* ({ input }) {
		// here you can init your subscription
		try {
			for (let i = 0; i < 3; i++) {
				// this simulates reading from a subscription
				await new Promise((resolve) => setTimeout(resolve, 1000));
				yield { b: input.a + i };
			}
		} finally {
			// this gets always called, either when you're done yielding or when the client disconnects
			console.log('finally done');
		}
	},
});
