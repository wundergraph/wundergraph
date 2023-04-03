import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		countryCode: z.string(),
	}),
	handler: async ({ input, operations }) => {
		return operations.query({
			operationName: 'CountryWeatherInternal',
			input: {
				countryCode: input.countryCode,
				// TODO: Remove this once we fix the bug that causes
				// the internal variables to not be removed from TS
				// operation calls
				capital: '',
			},
		});
	},
});
