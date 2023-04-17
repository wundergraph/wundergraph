import type { WebhookHttpEvent, WebhookHttpResponse } from '@wundergraph/sdk/server';
import { createWebhook } from '../generated/wundergraph.webhooks';

const webhook = createWebhook<WebhookHttpEvent, WebhookHttpResponse>({
	handler: async (event, context) => {
		return {
			statusCode: 200,
			body: {
				...(event.body as any),
			},
		};
	},
});

export default webhook;
