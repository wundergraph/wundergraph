import type { WebhookHttpEvent, WebhookHttpResponse } from '@wundergraph/sdk/server';
import { createWebhook } from '../generated/wundergraph.webhooks';

export default createWebhook<WebhookHttpEvent<{ country_code: string }>, WebhookHttpResponse<{ name: string }>>({
	handler: async (event, context) => {
		const country = await context.graph
			.from('countries')
			.query('country')
			.where({ code: event.body.country_code })
			.select('name')
			.exec();
		return {
			statusCode: 200,
			body: {
				name: country.name,
			},
		};
	},
});
