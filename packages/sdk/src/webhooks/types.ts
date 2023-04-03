import { InternalClient, OperationsClient } from '../server';
import { RequestMethod } from '../server/types';
import { WebhookVerifierKind } from './verifiers';
import { EnvironmentVariable } from '../configure/variables';

export interface Webhook<
	TInternalClient extends InternalClient = InternalClient,
	Event extends WebhookHttpEvent = WebhookHttpEvent,
	Response extends WebhookHttpResponse = WebhookHttpResponse,
	TOperationsClient extends OperationsClient = OperationsClient
> {
	handler: (event: Event, context: WebhookRequestContext<TInternalClient, TOperationsClient>) => Promise<Response>;
}
export interface WebhookHttpResponse<ResponseBody = unknown, Headers extends WebhookHeaders = WebhookHeaders> {
	statusCode?: number;
	body?: ResponseBody;
	headers?: Headers;
}
export type WebhookHeaders = Record<string, string>;
export type WebhookQuery = Record<string, string | string[]>;
export interface WebhookRequestContext<
	TInternalClient extends InternalClient = InternalClient,
	TOperationsClient extends OperationsClient = OperationsClient
> {
	internalClient: TInternalClient;
	log: WebhookLogger;
	operations: TOperationsClient;
}
interface LogFn {
	<T extends object>(obj: T, msg?: string, ...args: any[]): void;
	(obj: unknown, msg?: string, ...args: any[]): void;
	(msg: string, ...args: any[]): void;
}
export interface WebhookLogger {
	info: LogFn;
	debug: LogFn;
	error: LogFn;
}
export interface WebhookHttpEvent<
	Body = unknown,
	Query extends WebhookQuery = WebhookQuery,
	Headers extends WebhookHeaders = WebhookHeaders
> {
	method: RequestMethod;
	url: string;
	headers: Headers;
	query: Query;
	body: Body;
}

export interface WebhookConfiguration {
	verifier: {
		kind: WebhookVerifierKind;
		secret: EnvironmentVariable;
		signatureHeader: string;
		signatureHeaderPrefix: string;
	};
}

export interface WebhooksConfig {
	[name: string]: WebhookConfiguration;
}
