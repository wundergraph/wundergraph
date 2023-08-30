import { expectType } from 'tsd';
import {
	InternalOperationsDefinition,
	OperationsClient,
	Webhook,
	WebhookHttpEvent,
	WebhookHttpResponse,
} from '../src/server';

import { createWebhookFactory } from '../src/webhooks/factory';

type InternalOperations = InternalOperationsDefinition<{
	Weather: {
		input: { city: string };
		response: { data: { temp: string }; error: { message: string } };
	};
}>;

type InternalOperationsClient = OperationsClient<InternalOperations>;

const createWebhook = createWebhookFactory<InternalOperationsClient>();

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
			const { data, error } = await ctx.operations.query({
				operationName: 'Weather',
				input: {
					city: 'Berlin',
				},
			});
			return {
				statusCode: 200,
				body: { data, error },
			};
		},
	})
);

// restricted event and response with operations
expectType<Webhook<WebhookHttpEvent<{ city: string }>, WebhookHttpResponse<{ temp: string }>>>(
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
					temp: result.data?.temp || '0',
				},
			};
		},
	})
);
