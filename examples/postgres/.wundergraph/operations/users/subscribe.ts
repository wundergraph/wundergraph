import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
	handler: async function* ({ internalClient }) {
		try {
			// setup your subscription here, e.g. connect to a queue / stream
			for (let i = 0; i < 10; i++) {
				const users = await internalClient.queries.Users();
				yield { ...users.data?.db_findFirstusers };
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
