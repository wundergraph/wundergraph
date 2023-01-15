import { createOperation } from '@wundergraph/sdk';
import { z } from 'zod';

export default createOperation.query({
	input: z.object({
		id: z.string(),
	}),
	handler: async (ctx) => {
		console.log(`ctx data: ${JSON.stringify(ctx)}`);
		return {
			id: ctx.input.id,
			name: ctx.user?.name || 'no name',
			bio: ctx.user?.description || 'no bio',
			roles: ctx.user?.roles || [],
			time: new Date().toISOString(),
		};
	},
});
