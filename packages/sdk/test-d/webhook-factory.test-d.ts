import { expectType } from 'tsd';
import { InternalClient, OperationsClientType, Webhook, WebhookHttpEvent, WebhookHttpResponse } from '../src/server';

import { createWebhookFactory } from '../src/webhooks/factory';

type InternalOperations = OperationsClientType<{
	Weather: {
		input: { city: string };
		response: { temp: string };
	};
}>;

const createWebhook = createWebhookFactory<InternalOperations>();

// allow any event and response
expectType<Webhook>(
	createWebhook({
		handler: async (event, ctx) => {
			return {
				statusCode: 200,
				body: {
					hello: 'world',
				},
			};
		},
	})
);

// call operations
expectType<Webhook>(
	createWebhook({
		handler: async (event, ctx) => {
			const result = await ctx.operations.query({
				operationName: 'Weather',
				input: {
					city: 'Berlin',
				},
			});
			return {
				statusCode: 200,
				body: result,
			};
		},
	})
);

// restricted event and response with operations
expectType<Webhook<InternalClient, WebhookHttpEvent<{ city: string }>, WebhookHttpResponse<{ temp: string }>>>(
	createWebhook<WebhookHttpEvent<{ city: string }>, WebhookHttpResponse<{ temp: string }>>({
		handler: async (event, ctx) => {
			const result = await ctx.operations.query({
				operationName: 'Weather',
				input: {
					city: event.body.city,
				},
			});

			return {
				statusCode: 200,
				body: {
					temp: result.temp,
				},
			};
		},
	})
);
