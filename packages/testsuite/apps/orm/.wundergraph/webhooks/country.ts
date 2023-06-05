import { expectTypeOf } from 'vitest';
import type { WebhookHttpEvent, WebhookHttpResponse } from '@wundergraph/sdk/server';
import { createWebhook } from '../generated/wundergraph.webhooks';
import { RequestLogger } from '@wundergraph/sdk';

export default createWebhook<WebhookHttpEvent<{ country_code: string }>, WebhookHttpResponse<{ name: string }>>({
	handler: async (event, context) => {
		expectTypeOf(context.log).toMatchTypeOf<RequestLogger>;
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
