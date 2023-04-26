import type { WebhookHttpEvent, WebhookHttpResponse } from '@wundergraph/sdk/server';
import { createWebhook } from '../generated/wundergraph.webhooks';

const webhook = createWebhook<WebhookHttpEvent, WebhookHttpResponse>({
	handler: async (event, context) => {
		const weather = await context.operations.query({
			operationName: 'Weather',
			input: {
				forCity: 'Berlin',
			},
		});
		return {
			statusCode: 200,
			headers: {
				myResponseHeaderVar: 'test',
			},
			body: {
				myResponseBodyVar: weather.data?.getCityByName?.name,
			},
		};
	},
});

export default webhook;
