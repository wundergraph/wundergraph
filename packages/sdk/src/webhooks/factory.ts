import { OperationsClient } from '../server/operations-client';
import { InternalClient, Webhook, WebhookHttpEvent, WebhookHttpResponse, WebhookRequestContext } from '../server';

export const createWebhookFactory = <
	InternalOperations extends OperationsClient = OperationsClient,
	TInternalClient extends InternalClient = InternalClient,
	TCustomContext = any
>() => {
	return createWebhook<InternalOperations, TInternalClient, TCustomContext>();
};

export interface CreateWebhookProps<
	TEvent,
	TResponse,
	TOperationsClient extends OperationsClient,
	TInternalClient extends InternalClient,
	TCustomContext = any
> {
	handler: (
		event: TEvent,
		context: WebhookRequestContext<TInternalClient, TOperationsClient, TCustomContext>
	) => Promise<TResponse>;
}

const createWebhook = <
	TOperationsClient extends OperationsClient,
	TInternalClient extends InternalClient,
	TCustomContext = any
>() => {
	return <TEvent extends WebhookHttpEvent, TResponse extends WebhookHttpResponse>(
		webhook: CreateWebhookProps<TEvent, TResponse, TOperationsClient, TInternalClient, TCustomContext>
	): Webhook<TInternalClient, TEvent, TResponse, TOperationsClient> => {
		return webhook;
	};
};
