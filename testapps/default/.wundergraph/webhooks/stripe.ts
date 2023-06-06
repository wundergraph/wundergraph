import { createWebhook } from '../generated/wundergraph.webhooks';
import Stripe from 'stripe';

import { WebhookHttpEvent, WebhookHttpResponse } from '@wundergraph/sdk/server';

export default createWebhook<WebhookHttpEvent<Stripe.Event>, WebhookHttpResponse<{ type: string }>>({
	handler: async (event, ctx) => {
		return {
			statusCode: 200,
			body: {
				type: event.body?.type || 'unknown',
			},
		};
	},
});
