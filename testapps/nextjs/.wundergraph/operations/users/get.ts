import { createOperation, z } from '../../generated/wundergraph.factory';
import { ExtractResponse } from '@wundergraph/sdk/dist/operations';
import { ZodType } from 'zod';

const query = createOperation.query({
	input: z.object({
		id: z.number(),
	}),
	response: z.object({
		id: z.number(),
		userName: z.string(),
		bio: z.string().optional(),
	}),
	handler: async (ctx) => {
		return {
			id: ctx.input.id,
			userName: 'Jens Neuse',
			bio: 'Founder of WunderGraph',
		};
	},
});

export default query;
