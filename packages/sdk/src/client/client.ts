import {
	ClientConfig,
	ClientResponse,
	FetchUserRequestOptions,
	GraphQLResponse,
	Headers,
	LogoutOptions,
	MutationRequestOptions,
	OperationRequestOptions,
	QueryRequestOptions,
	SubscriptionEventHandler,
	SubscriptionRequestOptions,
	UploadRequestOptions,
	UploadResponse,
	User,
} from './types';
import { serialize } from '../utils';
import { GraphQLResponseError } from './GraphQLResponseError';
import { ResponseError } from './ResponseError';
import { InputValidationError } from './InputValidationError';
import { AuthorizationError } from './AuthorizationError';
import { ClientResponseError } from './ClientResponseError';
import { applyPatch } from 'fast-json-patch';

// https://graphql.org/learn/serving-over-http/

export interface UploadValidationOptions {
	/** Whether authentication is required to upload to this profile
	 *
	 * @default true
	 */
	requireAuthentication?: boolean;
	/** Maximum file size allowed per upload
	 *
	 * @default 10 * 1024 * 1024 (10MB)
	 */
	maxAllowedUploadSizeBytes?: number;
	/** Maximum number of files allowed per upload
	 *
	 * @default unlimited
	 */
	maxAllowedFiles?: number;
	/** List of allowed file extensions
	 *
	 * @default Any
	 */
	allowedFileExtensions?: string[];
	/** List of allowed mime types
	 *
	 * @default Any
	 */
	allowedMimeTypes?: string[];
}

interface LogoutResponse {
	redirect?: string;
}
export class Client {
	constructor(private options: ClientConfig) {
		this.baseHeaders = {
			'WG-SDK-Version': options.sdkVersion,
		};

		this.extraHeaders = { ...options.extraHeaders };

		this.csrfEnabled = options.csrfEnabled ?? true;
	}

	private readonly baseHeaders: Headers = {};
	private extraHeaders: Headers = {};
	private csrfToken: string | undefined;
	private csrfEnabled: boolean = true;

	public static buildCacheKey(query: OperationRequestOptions): string {
		return serialize(query);
	}

	public isAuthenticatedOperation(operationName: string) {
		return !!this.options.operationMetadata?.[operationName]?.requiresAuthentication;
	}

	private operationUrl(operationName: string) {
		return this.options.baseURL + '/operations/' + operationName;
	}

	private addUrlParams(url: string, queryParams: URLSearchParams): string {
		// avoid stringify to 'undefined'
		// remove empty params and values that are false
		for (const [key, value] of queryParams.entries()) {
			if (value == undefined || value == 'false') {
				queryParams.delete(key);
			}
			if (key === 'wg_variables' && value === '{}') {
				queryParams.delete(key);
			}
		}

		// stable stringify
		queryParams.sort();

		const intermediate = queryParams.toString();
		const intermediate2 = intermediate.replace('=&', '&');
		const queryString = intermediate2.endsWith('=') ? intermediate2.slice(0, -1) : intermediate2;

		return url + (queryString ? `?${queryString}` : '');
	}

	private async fetchJson(url: string, init: RequestInit = {}) {
		init.headers = { ...init.headers, Accept: 'application/json', 'Content-Type': 'application/json' };
		return this.fetch(url, init);
	}

	private async fetch(input: RequestInfo, init: RequestInit = {}): Promise<globalThis.Response> {
		const fetchImpl = this.options.customFetch || globalThis.fetch;

		init.headers = {
			...this.baseHeaders,
			...this.extraHeaders,
			...init.headers,
		};

		return fetchImpl(input, {
			credentials: 'include',
			mode: 'cors',
			...init,
		});
	}

	private convertGraphQLResponse(resp: GraphQLResponse): ClientResponse {
		// If there were no errors returned, the "errors" field should not be present on the response.
		// If no data is returned, according to the GraphQL spec,
		// the "data" field should only be included if no errors occurred during execution.
		if (resp.errors && resp.errors.length) {
			return {
				error: new GraphQLResponseError(resp.errors),
			};
		}

		if (!resp.data) {
			return {
				error: new ResponseError('Invalid response from the server', 200),
			};
		}

		return {
			data: resp.data,
		};
	}

	// Determines whether the body is unparseable, plain text, or json (and assumes an invalid input if json)
	private async handleClientResponseError(response: globalThis.Response): Promise<ClientResponseError> {
		const text = await response.text();
		try {
			const json = JSON.parse(text);

			switch (response.status) {
				case 401:
					return new AuthorizationError(json.errors[0]?.message.trim(), response.status);
				case 400:
					return new InputValidationError(json, response.status);
				default:
					return new ResponseError((json.errors[0]?.message || json.message).trim(), response.status);
			}
		} catch {
			return new ResponseError(text.length ? text.trim() : 'Response is not OK', response.status);
		}
	}

	/***
	 * fetchResponseToClientResponse converts a fetch response to a ClientResponse.
	 * Network errors or non-200 status codes are converted to an error. Application errors
	 * as from GraphQL are returned as an Error from type GraphQLResponseError.
	 */
	private async fetchResponseToClientResponse(response: globalThis.Response): Promise<ClientResponse> {
		// The Promise returned from fetch() won't reject on HTTP error status
		// even if the response is an HTTP 404 or 500.

		if (!response.ok) {
			return { error: await this.handleClientResponseError(response) };
		}

		const json = await response.json();

		return this.convertGraphQLResponse({
			data: json.data,
			errors: json.errors,
		});
	}

	private stringifyInput(input: any) {
		return JSON.stringify(input || {});
	}

	public setExtraHeaders(headers: Headers) {
		this.extraHeaders = {
			...this.extraHeaders,
			...headers,
		};
	}

	/**
	 * setAuthorizationToken is a shorthand method for setting up the
	 * required headers for token authentication.
	 *
	 * @param token Bearer token
	 */
	public setAuthorizationToken(token: string) {
		this.setExtraHeaders({
			Authorization: `Bearer ${token}`,
		});
	}

	/**
	 * unsetAuthorization removes any previously set authorization credentials
	 * (e.g. via setAuthorizationToken or via setExtraHeaders).
	 * If there was no authorization set, it does nothing.
	 */
	public unsetAuthorization() {
		delete this.extraHeaders['Authorization'];
	}

	/***
	 * Query makes a GET request to the server.
	 * The method only throws an error if the request fails to reach the server or
	 * the server returns a non-200 status code. Application errors are returned as part of the response.
	 */
	public async query<RequestOptions extends QueryRequestOptions, ResponseData = any>(
		options: RequestOptions
	): Promise<ClientResponse<ResponseData>> {
		const params = {
			wg_variables: this.stringifyInput(options.input),
			wg_api_hash: this.options.applicationHash,
		};
		const url = this.addUrlParams(
			this.operationUrl(options.operationName),
			new URLSearchParams(
				options.subscribeOnce
					? {
							wg_subscribe_once: options.subscribeOnce ? '' : 'false',
							...params,
					  }
					: params
			)
		);
		const resp = await this.fetchJson(url, {
			method: 'GET',
			signal: options.abortSignal,
		});

		return this.fetchResponseToClientResponse(resp);
	}

	private async getCSRFToken(): Promise<string> {
		// request a new CSRF token if we don't have one
		if (!this.csrfToken) {
			const res = await this.fetch(`${this.options.baseURL}/auth/cookie/csrf`, {
				headers: {
					...this.baseHeaders,
					Accept: 'text/plain',
				},
			});
			this.csrfToken = await res.text();

			if (!this.csrfToken) {
				throw new Error('Failed to get CSRF token. Please make sure you are authenticated.');
			}
		}
		return this.csrfToken;
	}

	/***
	 * Mutate makes a POST request to the server.
	 * The method only throws an error if the request fails to reach the server or
	 * the server returns a non-200 status code. Application errors are returned as part of the response.
	 */
	public async mutate<RequestOptions extends MutationRequestOptions, ResponseData = any>(
		options: RequestOptions
	): Promise<ClientResponse<ResponseData>> {
		const url = this.addUrlParams(
			this.operationUrl(options.operationName),
			new URLSearchParams({
				wg_api_hash: this.options.applicationHash,
			})
		);

		const headers: Headers = {};

		if (this.isAuthenticatedOperation(options.operationName) && this.csrfEnabled) {
			headers['X-CSRF-Token'] = await this.getCSRFToken();
		}

		const resp = await this.fetchJson(url, {
			method: 'POST',
			signal: options.abortSignal,
			body: this.stringifyInput(options.input),
			headers,
		});

		return this.fetchResponseToClientResponse(resp);
	}

	/***
	 * fetchUser makes a GET request to the server to fetch the current user.
	 * The method throws an error if the request fails to reach the server or
	 * the server returns a non-200 status code.
	 */
	public async fetchUser<U extends User>(options?: FetchUserRequestOptions): Promise<U> {
		const params = new URLSearchParams({
			revalidate: options?.revalidate ? '' : 'false',
		});

		const response = await this.fetchJson(this.addUrlParams(`${this.options.baseURL}/auth/user`, params), {
			method: 'GET',
			signal: options?.abortSignal,
		});

		if (!response.ok) {
			throw await this.handleClientResponseError(response);
		}

		return response.json();
	}

	/**
	 * Set up subscriptions over SSE with fallback to web streams.
	 * When called with subscribeOnce it will return the response directly
	 * without setting up a subscription.
	 * @see https://docs.wundergraph.com/docs/architecture/wundergraph-rpc-protocol-explained#subscriptions
	 */
	public async subscribe<RequestOptions extends SubscriptionRequestOptions, ResponseData = unknown>(
		options: RequestOptions,
		cb: SubscriptionEventHandler<ResponseData>
	) {
		if (options.subscribeOnce) {
			const result = await this.query<RequestOptions, ResponseData>(options);
			cb(result);
			return result;
		}
		if ('EventSource' in globalThis) {
			return this.subscribeWithSSE<ResponseData>(options, cb);
		}
		for await (const event of this.subscribeWithFetch<ResponseData>(options)) {
			cb(event);
		}
	}

	private subscribeWithSSE<ResponseData = any>(
		subscription: SubscriptionRequestOptions,
		cb: SubscriptionEventHandler<ResponseData>
	) {
		return new Promise<void>((resolve, reject) => {
			const params = new URLSearchParams({
				wg_variables: this.stringifyInput(subscription.input),
				wg_live: subscription?.liveQuery ? '' : 'false',
				wg_sse: '',
				wg_json_patch: '',
			});
			const url = this.addUrlParams(this.operationUrl(subscription.operationName), params);
			const eventSource = new EventSource(url, {
				withCredentials: true,
			});
			eventSource.addEventListener('error', () => {
				reject(new Error(`SSE connection error: ${subscription.operationName}`));
			});
			eventSource.addEventListener('open', () => {
				resolve();
			});
			let lastResponse: GraphQLResponse | null = null;
			eventSource.addEventListener('message', (ev) => {
				if (ev.data === 'done') {
					eventSource.close();
					return;
				}
				const jsonResp = JSON.parse(ev.data);
				// we parse the json response, which might be a json patch (array) or a full response (object)
				if (lastResponse !== null && Array.isArray(jsonResp)) {
					// we have a lastResponse and the current response is a json patch
					// we apply the patch to generate the latest response
					lastResponse = applyPatch(lastResponse, jsonResp).newDocument as GraphQLResponse;
				} else {
					// it's not a patch, so we just set the lastResponse to the current response
					lastResponse = jsonResp as GraphQLResponse;
				}
				cb(this.convertGraphQLResponse(lastResponse));
			});
			if (subscription?.abortSignal) {
				subscription?.abortSignal.addEventListener('abort', () => eventSource.close());
			}
		});
	}

	private async *subscribeWithFetch<ResponseData = any>(
		subscription: SubscriptionRequestOptions
	): AsyncGenerator<ClientResponse<ResponseData>> {
		const params = new URLSearchParams({
			wg_variables: this.stringifyInput(subscription.input),
			wg_live: subscription?.liveQuery ? '' : 'false',
		});
		const url = this.addUrlParams(this.operationUrl(subscription.operationName), params);
		const response = await this.fetchJson(url, {
			method: 'GET',
			signal: subscription.abortSignal,
		});

		if (!response.ok || response.body === null) {
			yield {
				error: new ResponseError('HTTP Error', response.status),
			};
			return;
		}

		// web-streams, no support in node-fetch or Node.js yet
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let message: string = '';
		let lastResponse: GraphQLResponse | null = null;
		while (true) {
			const { value, done } = await reader.read();
			if (done) return;
			if (!value) continue;
			message += decoder.decode(value);
			if (message.endsWith('\n\n')) {
				const jsonResp = JSON.parse(message.substring(0, message.length - 2));
				if (lastResponse !== null && Array.isArray(jsonResp)) {
					lastResponse = applyPatch(lastResponse, jsonResp).newDocument as GraphQLResponse;
				} else {
					lastResponse = jsonResp as GraphQLResponse;
				}
				yield this.convertGraphQLResponse(lastResponse);
				message = '';
			}
		}
	}

	/**
	 * Uploads one or more files to the server. Authentication is required. The method throws an error if the files
	 * could not be uploaded for any reason. If the upload was successful, your return a list
	 * of file IDs that can be used to download the files from your S3 bucket.
	 */
	public async uploadFiles<UploadOptions extends UploadRequestOptions>(
		config: UploadOptions,
		validation?: UploadValidationOptions
	): Promise<UploadResponse> {
		this.validateFiles(config, validation);
		const formData = new FormData();
		for (const [_, file] of Object.entries(config.files)) {
			if (file instanceof Blob) {
				formData.append('files', file);
			}
		}

		const headers: Headers = {};

		if (this.csrfEnabled && (validation?.requireAuthentication ?? true)) {
			headers['X-CSRF-Token'] = await this.getCSRFToken();
		}

		const params = new URLSearchParams({
			wg_api_hash: this.options.applicationHash,
		});

		if ('profile' in config) {
			headers['X-Upload-Profile'] = (config as any).profile;
		}

		if ('meta' in config) {
			headers['X-Metadata'] = (config as any).meta ? JSON.stringify((config as any).meta) : '';
		}

		const response = await this.fetch(
			this.addUrlParams(`${this.options.baseURL}/s3/${config.provider}/upload`, params),
			{
				// Dont set the content-type header, the browser will set it for us + boundary
				headers,
				body: formData,
				method: 'POST',
				signal: config.abortSignal,
			}
		);

		if (!response.ok) {
			throw await this.handleClientResponseError(response);
		}

		const result = await response.json();

		if (!result.length) {
			throw new ResponseError(`Invalid server response shape`, response.status);
		}

		const json = result as { key: string }[];
		return {
			fileKeys: json.map((x) => x.key),
		};
	}

	public validateFiles(config: UploadRequestOptions, validation?: UploadValidationOptions) {
		if (validation?.maxAllowedFiles && config.files.length > validation.maxAllowedFiles) {
			throw new Error(`uploading ${config.files.length} exceeds the maximum allowed (${validation.maxAllowedFiles})`);
		}
		for (const file of config.files) {
			if (validation?.maxAllowedUploadSizeBytes && file.size > validation.maxAllowedUploadSizeBytes) {
				throw new Error(
					`file ${file.name} with size ${file.size} exceeds the maximum allowed (${validation.maxAllowedUploadSizeBytes})`
				);
			}
			if (validation?.allowedFileExtensions && file.name.includes('.')) {
				const ext = file.name.substring(file.name.indexOf('.') + 1).toLowerCase();
				if (ext) {
					if (validation.allowedFileExtensions.findIndex((item) => item.toLocaleLowerCase()) < 0) {
						throw new Error(`file ${file.name} with extension ${ext} is not allowed`);
					}
				}
			}
			if (validation?.allowedMimeTypes) {
				const mimeType = file.type;
				const idx = validation.allowedMimeTypes.findIndex((item) => {
					// Full match
					if (item == mimeType) {
						return true;
					}
					// Try wildcard match. This is a bit brittle but it should be fine
					// as long as profile?.allowedMimeTypes contains only valid entries
					return mimeType.match(new RegExp(item.replace('*', '.*')));
				});
				if (idx < 0) {
					throw new Error(`file ${file.name} with MIME type ${mimeType} is not allowed`);
				}
			}
		}
	}

	public login(authProviderID: string, redirectURI?: string) {
		// browser check
		if (typeof window === 'undefined') {
			throw new Error('login() can only be called in a browser environment');
		}

		const params = new URLSearchParams({
			redirect_uri: redirectURI || window.location.toString(),
		});

		const url = this.addUrlParams(`${this.options.baseURL}/auth/cookie/authorize/${authProviderID}`, params);

		window.location.assign(url);
	}

	public async logout(options?: LogoutOptions): Promise<boolean> {
		// browser check
		if (typeof window === 'undefined') {
			throw new Error('logout() can only be called in a browser environment');
		}

		const params = new URLSearchParams({
			logout_openid_connect_provider: options?.logoutOpenidConnectProvider ? 'true' : 'false',
		});

		const url = this.addUrlParams(`${this.options.baseURL}/auth/cookie/user/logout`, params);

		const response = await this.fetch(url, {
			method: 'GET',
		});

		if (!response.ok) {
			return false;
		}

		let ok = true;
		if (response.headers.get('Content-Type')?.includes('application/json')) {
			const data = (await response.json()) as LogoutResponse;
			if (data.redirect) {
				if (options?.redirect) {
					ok = await options.redirect(data.redirect);
				} else {
					window.location.href = data.redirect;
				}
			}
		}

		if (ok && options?.after) {
			options.after();
		}

		return ok;
	}
}
