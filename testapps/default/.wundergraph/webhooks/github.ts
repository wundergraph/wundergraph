import localImported from './../../local-import';
import { buildSchema } from 'graphql';
import type { Webhook, WebhookHttpEvent, WebhookHttpResponse } from '@wundergraph/sdk/server';
import type { InternalClient } from '../generated/wundergraph.internal.client';

const webhook: Webhook<
	InternalClient,
	WebhookHttpEvent<{ myBodyVar: string }, { myQueryVar: string }, { myHeaderVar: string }>,
	WebhookHttpResponse<{ myResponseBodyVar: string; localImported: number }, { myResponseHeaderVar: string }>
> = {
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
};

export default webhook;
