import { InternalClient as InternalClientBase } from '../middleware/internal-client';
import { RequestMethod } from '../middleware/server';

export interface Webhook<InternalClient = InternalClientBase, Body = any, ResponseBody = any> {
	handler: (
		event: WebhookHttpEvent<InternalClient, Body>,
		context: WebhookRequestContext<InternalClient>
	) => Promise<WebhookResponse<ResponseBody>>;
}
export interface WebhookResponse<ResponseBody> {
	statusCode?: number;
	body?: ResponseBody;
	headers?: WebhookHeaders;
}
export type WebhookHeaders = Record<string, string>;
export type WebhookQuery = Record<string, string | string[]>;
export interface WebhookRequestContext<InternalClient = any> {
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
export interface WebhookHttpEvent<InternalClient, Body> {
	method: RequestMethod;
	url: string;
	headers: WebhookHeaders;
	query: WebhookQuery;
	body: Body;
}
