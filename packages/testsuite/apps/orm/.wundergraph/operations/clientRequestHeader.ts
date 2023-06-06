import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		header: z.string(),
	}),
	handler: async ({ input, graph }) => {
		const value = await graph.from('echo').query('clientRequestHeader').where({ header: input.header }).exec();
		return {
			header: input.header,
			value,
		};
	},
});
