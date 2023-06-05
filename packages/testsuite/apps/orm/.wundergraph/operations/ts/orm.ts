import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ graph, log }) => {
		const germany = await graph.from('countries').query('country').where({ code: 'DE' }).select('code').exec();
		return {
			code: germany.code,
		};
	},
});
