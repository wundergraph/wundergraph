import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		code: z.string(),
	}),
	handler: async (ctx) => {
		const country = await ctx.operations.query({
			operationName: 'Country',
			input: {
				code: ctx.input.code,
			},
		});
		const weather = await ctx.operations.query({
			operationName: 'Weather',
			input: {
				city: country.data?.countries_country?.capital || '',
			},
		});
		return {
			country: country.data?.countries_country,
			weather: weather.data?.weather_getCityByName?.weather,
		};
	},
});
