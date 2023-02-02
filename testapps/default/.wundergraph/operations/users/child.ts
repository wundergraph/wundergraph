import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
	input: z.object({
		a: z.number(),
	}),
	handler: async function* ({ input, operations }) {
		try {
			const subscription = await operations.subscribe({
				operationName: 'users/parent',
				input: {
					a: 1,
				},
			});
			for await (const message of subscription) {
				const x = (message.data?.b || 0) * 2;
				const user = await operations.query({ operationName: 'users/get' });
				const put = await operations.mutate({ operationName: 'users/put', input: { x: 1 } });
				const u = user.data?.hello;
				yield { x, u, put };
			}
		} finally {
			console.log('finally');
		}
	},
});
