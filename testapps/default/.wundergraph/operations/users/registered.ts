import { z } from 'zod';
import { createOperation } from '@wundergraph/sdk';

export default createOperation.subscription({
	input: z.object({
		a: z.number(),
	}),
	subscribe: async function* ({ input }) {
		// here you can init your subscription
		try {
			for (let i = 0; i < 3; i++) {
				// this simulates reading from a subscription

				yield { b: input.a + i };
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		} finally {
			// this gets always called, either when you're done yielding or when the client disconnects
			console.log('finally done');
		}
	},
});
