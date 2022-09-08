import { InternalClient as InternalClientBase } from '../middleware/internal-client';
import { RequestMethod } from '../middleware/types';
import { WebhookVerifierKind } from './verifiers';
import { EnvironmentVariable } from '../configure';

export interface Webhook<
	InternalClient extends InternalClientBase = InternalClientBase,
	Event extends WebhookHttpEvent<InternalClient> = WebhookHttpEvent<InternalClient>,
	Response extends WebhookResponse = WebhookResponse
> {
	handler: (event: Event, context: WebhookRequestContext<InternalClient>) => Promise<Response>;
}
export interface WebhookResponse<ResponseBody = unknown, Headers extends WebhookHeaders = WebhookHeaders> {
	statusCode?: number;
	body?: ResponseBody;
	headers?: Headers;
}
export type WebhookHeaders = Record<string, string>;
export type WebhookQuery = Record<string, string | string[]>;
export interface WebhookRequestContext<InternalClient extends InternalClientBase = InternalClientBase> {
	internalClient: InternalClient;
	log: Logger;
}
interface LogFn {
	<T extends object>(obj: T, msg?: string, ...args: any[]): void;
	(obj: unknown, msg?: string, ...args: any[]): void;
	(msg: string, ...args: any[]): void;
}
export interface Logger {
	info: LogFn;
	debug: LogFn;
	error: LogFn;
}
export interface WebhookHttpEvent<
	InternalClient extends InternalClientBase = InternalClientBase,
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
