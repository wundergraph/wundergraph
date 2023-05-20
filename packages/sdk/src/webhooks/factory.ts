import { OperationsClient } from '../server/operations-client';
import { InternalClient, Webhook, WebhookHttpEvent, WebhookHttpResponse, WebhookRequestContext } from '../server';
import type { ORM } from '../orm';

export const createWebhookFactory = <
	InternalOperations extends OperationsClient = OperationsClient,
	TInternalClient extends InternalClient = InternalClient,
	TCustomContext = any,
	TypedORM = ORM<any>,
>() => {
	return createWebhook<InternalOperations, TInternalClient, TCustomContext, TypedORM>();
};

export interface CreateWebhookProps<
	TEvent,
	TResponse,
	TOperationsClient extends OperationsClient,
	TInternalClient extends InternalClient,
	TCustomContext = any,
	TypedORM = ORM<any>,
> {
	handler: (
		event: TEvent,
		context: WebhookRequestContext<TInternalClient, TOperationsClient, TCustomContext, TypedORM>
	) => Promise<TResponse>;
}

const createWebhook = <
	TOperationsClient extends OperationsClient,
	TInternalClient extends InternalClient,
	TCustomContext = any,
	TypedORM = ORM<any>
>() => {
	return <TEvent extends WebhookHttpEvent, TResponse extends WebhookHttpResponse>(
		webhook: CreateWebhookProps<TEvent, TResponse, TOperationsClient, TInternalClient, TCustomContext, TypedORM>
	): Webhook<TInternalClient, TEvent, TResponse, TOperationsClient> => {
		return webhook;
	};
};
