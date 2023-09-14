import { OperationsClient } from '../server/operations-client';
import { Webhook, WebhookHttpEvent, WebhookHttpResponse, WebhookRequestContext } from '../server';
import type { ORM } from '../orm';

export const createWebhookFactory = <
	InternalOperations extends OperationsClient = OperationsClient,
	TCustomContext = any,
	TypedORM = ORM<any>
>() => {
	return createWebhook<InternalOperations, TCustomContext, TypedORM>();
};

export interface CreateWebhookProps<
	TEvent,
	TResponse,
	TOperationsClient extends OperationsClient,
	TCustomContext = any,
	TypedORM = ORM<any>
> {
	handler: (
		event: TEvent,
		context: WebhookRequestContext<TOperationsClient, TCustomContext, TypedORM>
	) => Promise<TResponse>;
}

const createWebhook = <TOperationsClient extends OperationsClient, TCustomContext = any, TypedORM = ORM<any>>() => {
	return <TEvent extends WebhookHttpEvent, TResponse extends WebhookHttpResponse>(
		webhook: CreateWebhookProps<TEvent, TResponse, TOperationsClient, TCustomContext, TypedORM>
	): Webhook<TEvent, TResponse, TOperationsClient> => {
		return webhook;
	};
};
