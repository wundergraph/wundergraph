import { createWebhook } from '../generated/wundergraph.webhooks';

import { WebhookHttpEvent, WebhookHttpResponse } from '@wundergraph/sdk/server';

export default createWebhook<WebhookHttpEvent<any>, WebhookHttpResponse<{ type: string }>>({
	handler: async (event, ctx) => {
		return {
			statusCode: 200,
			body: {
				type: event.body?.type || 'unknown',
			},
		};
	},
});
