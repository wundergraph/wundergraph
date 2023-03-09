import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		countryCode: z.string(),
	}),
	handler: async ({ operations, input }) => {
		const country = await operations.query({
			operationName: 'weather/Country',
			input: {
				code: input.countryCode,
			},
		});
		if (!country.data?.countries_countries[0].capital) {
			throw new Error('No capital found');
		}
		const weather = await operations.query({
			operationName: 'weather/Weather',
			input: {
				city: country.data?.countries_countries[0].capital,
			},
		});
		const out: {
			country: string;
			capital: string;
			weather: {
				title: string;
				description: string;
			};
		} = {
			country: country.data?.countries_countries[0].name || '',
			capital: country.data?.countries_countries[0].capital || '',
			weather: {
				title: weather.data?.weather_getCityByName?.weather?.summary?.title || '',
				description: weather.data?.weather_getCityByName?.weather?.summary?.description || '',
			},
		};
		return out;
	},
});
