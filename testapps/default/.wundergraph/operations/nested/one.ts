import { createOperation } from '@wundergraph/sdk';
import { z } from 'zod';

export default createOperation.query({
	input: z.object({
		a: z.number(),
	}),
	handler: async (input) => {
		return {
			b: input.a,
		};
	},
	internal: true,
	requireAuthentication: true,
});
