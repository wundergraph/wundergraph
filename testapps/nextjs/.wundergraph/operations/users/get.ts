import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		id: z.number(),
	}),
	handler: async (ctx) => {
		const weather = await ctx.internalClient.queries.Weather({
			input: {
				forCity: 'Berlin',
			},
		});
		return {
			id: ctx.input.id,
			userName: 'Jens Neuse',
			bio: 'Founder of WunderGraph',
			weather: weather.data?.getCityByName,
		};
	},
});
