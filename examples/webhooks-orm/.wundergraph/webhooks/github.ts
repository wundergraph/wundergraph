import type { WebhookHttpEvent, WebhookHttpResponse } from '@wundergraph/sdk/server';
import type { InternalClient } from '../generated/wundergraph.internal.client';
import type { ORM as TypedORM } from '../generated/orm';

import { createWebhook } from '../generated/wundergraph.webhooks';

const webhook = createWebhook<
WebhookHttpEvent<{ myBodyVar: string }, { myQueryVar: string }, { myHeaderVar: string }>,
WebhookHttpResponse<{dragons: readonly { readonly id: string | null }[]}, { myResponseHeaderVar: string }>
>({
	handler: async (event, context) => {
		const dragons = await context.graph.from('spacex').query('dragons').select('id').exec()		
		return {
			statusCode: 200,
			headers: {
				myResponseHeaderVar: 'test',
			},
			body: {
				dragons
			},
		};
}
})
	

export default webhook;
