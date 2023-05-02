import { createOperation, z } from '../../generated/wundergraph.factory';
import { NotFoundErr, RateLimitErr } from '../../../errors/errors';

export default createOperation.query({
	errors: [NotFoundErr, RateLimitErr],
	handler: async ({ operations }) => {
		// GraphQL operation
		const { error, data } = await operations.query({
			operationName: 'Weather',
			input: {
				forCity: 'Berlin',
			},
		});

		// TypeScript operation
		const { error: error2, data: data2 } = await operations.query({
			operationName: 'users/throw',
			input: {
				throw: 'NotFound',
			},
		});

		const name = data?.getCityByName?.name;

		return {};
	},
});
