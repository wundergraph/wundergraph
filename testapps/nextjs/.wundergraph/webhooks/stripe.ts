import { createWebhook } from '../generated/wundergraph.webhooks';
import Stripe from 'stripe';

import { WebhookHttpEvent, WebhookHttpResponse } from '@wundergraph/sdk/server';

export default createWebhook<WebhookHttpEvent<Stripe.Event>, WebhookHttpResponse<{ type: string; name?: string }>>({
	handler: async (event, ctx) => {
		const user = await ctx.operations.query({
			operationName: 'Hello',
			input: {
				hello: '1',
			},
		});
		return {
			statusCode: 200,
			body: {
				type: event.body?.type || 'unknown',
				name: user.data?.gql_hello,
			},
		};
	},
});
