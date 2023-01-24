import { createOperation, z, AuthorizationError } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		id: z.number(),
	}),
	handler: async (ctx) => {
		throw new AuthorizationError('not allowed');
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
