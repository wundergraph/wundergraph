import { OperationsClient } from '../server/operations-client';
import { InternalClient, Webhook, WebhookHttpEvent, WebhookHttpResponse, WebhookRequestContext } from '../server';

export const createWebhookFactory = <
	InternalOperations extends OperationsClient = OperationsClient,
	TInternalClient extends InternalClient = InternalClient
>() => {
	return createWebhook<InternalOperations, TInternalClient>();
};

export interface CreateWebhookProps<
	TEvent,
	TResponse,
	TOperationsClient extends OperationsClient,
	TInternalClient extends InternalClient
> {
	handler: (event: TEvent, context: WebhookRequestContext<TInternalClient, TOperationsClient>) => Promise<TResponse>;
}

const createWebhook = <TOperationsClient extends OperationsClient, TInternalClient extends InternalClient>() => {
	return <TEvent extends WebhookHttpEvent, TResponse extends WebhookHttpResponse>(
		webhook: CreateWebhookProps<TEvent, TResponse, TOperationsClient, TInternalClient>
	): Webhook<TInternalClient, TEvent, TResponse, TOperationsClient> => {
		return webhook;
	};
};
