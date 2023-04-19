import { createOperation, z } from '../../generated/wundergraph.factory';
import { BadRequestErr, NotFoundErr, RateLimitErr } from '../../errors/errors';

export default createOperation.query({
	errors: [RateLimitErr, NotFoundErr, BadRequestErr],
	input: z.object({
		throw: z.enum(['NotFound', 'RateLimit', 'BadRequest', 'noError'] as const),
	}),
	handler: async ({ operations, input }) => {
		if (input.throw === 'NotFound') {
			throw new NotFoundErr();
		} else if (input.throw === 'RateLimit') {
			throw new RateLimitErr();
		} else if (input.throw === 'BadRequest') {
			throw new BadRequestErr();
		}

		return input.throw;
	},
});
