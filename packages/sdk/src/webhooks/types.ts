export interface WebHook {
	handler: WebHookHandler;
}
export interface WebHookHandler {
	(): Promise<void>;
}
