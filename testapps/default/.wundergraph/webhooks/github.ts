import localImported from './../../local-import';
import { buildSchema } from 'graphql';
import type { WebhookHttpEvent, WebhookHttpResponse } from '@wundergraph/sdk/server';
import { createWebhook } from '../generated/wundergraph.webhooks';

import type { WebhookEvent } from '@octokit/webhooks-types';

const webhook = createWebhook<WebhookHttpEvent<WebhookEvent>, WebhookHttpResponse>({
	handler: async (event, context) => {
		event.query.myQueryVar;
		// event.body.myBodyVar;
		event.headers.myHeaderVar;

		// demonstrate that we can reference to external packages
		// and don't bundle them into the webhook.
		buildSchema(`scalar DateTime`);

		context.log.info(event.headers);

		return {
			statusCode: 200,
			headers: {
				myResponseHeaderVar: 'test',
			},
			body: {
				myResponseBodyVar: 'world',
				localImported,
			},
		};
	},
});

export default webhook;
