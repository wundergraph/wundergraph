import { createOperation } from '@wundergraph/sdk';
import { z } from 'zod';
import { InternalClient } from '../../generated/wundergraph.internal.client';

export default createOperation.query({
	input: z.object({
		id: z.string(),
	}),
	handler: async (ctx) => {
		console.log(`ctx data: ${JSON.stringify(ctx.input.id)}`);
		const weather = await (ctx.internalClient as InternalClient).queries.Weather({ input: { forCity: 'Berlin' } });
		return {
			id: ctx.input.id,
			name: ctx.user?.name || 'no name',
			bio: ctx.user?.description || 'no bio',
			roles: ctx.user?.roles || [],
			time: new Date().toISOString(),
			weather,
		};
	},
});
