import { createOperation, z } from '../../generated/wundergraph.factory';
import { NotFoundErr, RateLimitErr } from '../../../errors/errors';

export default createOperation.query({
	errors: [NotFoundErr, RateLimitErr],
	handler: async ({ operations, input }) => {
		// GraphQL operation
		const { errors, data } = await operations.query({
			operationName: 'Weather',
			input: {
				forCity: 'Berlin',
			},
		});

		// TypeScript operation
		const { errors: errors2, data: data2 } = await operations.query({
			operationName: 'users/throw',
			input: {
				throw: 'NotFound',
			},
		});

		return input.throw;
	},
});
