import { Headers } from 'headers-polyfill';
import { ParsedUrlQuery } from 'querystring';

export interface WebHook {
	handler: WebHookHandler;
}
export interface WebHookHandler {
	(request: WebHookRequest, reply: WebHookReply): Promise<void>;
}
export interface WebHookRequest {
	headers: Headers;
	url: string;
	query: ParsedUrlQuery | unknown;
}
export interface WebHookReply {
	code(statusCode: number): this;
	header(key: string, value: string): this;
	send(value: any): this;
}
