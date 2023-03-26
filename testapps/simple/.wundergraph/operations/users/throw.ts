import { createOperation, z } from '../../generated/wundergraph.factory';
import { NotFoundErr, RateLimitErr } from '../../../errors/errors';

export default createOperation.query({
	errors: [RateLimitErr(), NotFoundErr()],
	input: z.object({
		throw: z.enum(['NotFound', 'RateLimit', 'noError'] as const),
	}),
	handler: async ({ operations, input }) => {
		if (input.throw === 'NotFound') {
			throw NotFoundErr();
		} else if (input.throw === 'RateLimit') {
			throw RateLimitErr();
		}

		return input.throw;
	},
});
