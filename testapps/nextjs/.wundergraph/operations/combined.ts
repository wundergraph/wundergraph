import { createOperation, z } from '#/generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		// we define the input of the operation
		code: z.string(),
	}),
	handler: async (ctx) => {
		// using ctx.operations, we can call the previously defined GraphQL Operations
		// both input and response of the GraphQL Operations are fully typed
		const country = await ctx.operations.query({
			operationName: 'Country',
			input: {
				code: ctx.input.code,
			},
		});
		const weather = await ctx.operations.query({
			operationName: 'Weather',
			input: {
				forCity: country.data?.countries_country?.name || '',
			},
		});
		return {
			// finally, we return the combined data
			// as you can see, we can easily map the data as it's type-safe
			country: country.data?.countries_country,
			weather: weather.data?.getCityByName?.weather,
		};
	},
});
