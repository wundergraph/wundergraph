import { createOperation } from '../../wundergraph.operations';
import { z } from 'zod';

export default createOperation.subscription({
	input: z.object({
		id: z.string(),
	}),
	handler: async function* (ctx) {
		try {
			for (let i = 0; i < 10; i++) {
				yield {
					id: ctx.input.id,
					userName: 'Jens Neuse',
					bio: 'Founder of WunderGraph',
					time: new Date().toISOString(),
				};
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		} finally {
			console.log('Client disconnected');
		}
	},
});
