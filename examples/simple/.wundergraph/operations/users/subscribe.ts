import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
	input: z.object({
		id: z.string(),
	}),
	handler: async function* ({ input }) {
		try {
			// setup your subscription here, e.g. connect to a queue / stream
			for (let i = 0; i < 10; i++) {
				yield {
					id: input.id,
					name: 'Jens',
					bio: 'Founder of WunderGraph',
					time: new Date().toISOString(),
				};
				// let's fake some delay
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		} finally {
			// finally gets called, when the client disconnects
			// you can use it to clean up the queue / stream connection
			console.log('client disconnected');
		}
	},
});
