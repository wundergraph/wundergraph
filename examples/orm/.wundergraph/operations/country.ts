import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		code: z.string(),
	}),
	handler: async ({ input, graph }) => {
		const germany = await graph.from('countries').query('country').where({ code: input.code }).exec();
		const weather = await graph
			.from('weather')
			.query('getCityByName')
			.where({ name: germany?.capital || '' })
			.select('weather.summary.icon', 'weather.summary.description', 'weather.summary.title')
			.exec();
		return {
			germany,
			weather,
		};
	},
});
