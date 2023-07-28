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
import { applyPatch } from 'fast-json-patch';
import {
	ResponseError,
	InputValidationError,
	AuthorizationError,
	ValidationResponseJSON,
	ClientOperationErrorCodes,
	NoUserError,
} from './errors';

// We follow https://docs.wundergraph.com/docs/architecture/wundergraph-rpc-protocol-explained

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
	constructor(protected options: ClientConfig) {
		this.baseHeaders = options.sdkVersion
			? {
					'WG-SDK-Version': options.sdkVersion,
			  }
			: {};

		this.extraHeaders = { ...options.extraHeaders };

		this.csrfEnabled = options.csrfEnabled ?? true;
	}

	protected readonly baseHeaders: Headers = {};
	private extraHeaders: Headers = {};
	private csrfToken: string | undefined;
	protected readonly csrfEnabled: boolean = true;

	public static buildCacheKey(query: OperationRequestOptions): string {
		return serialize(query);
	}

	public isAuthenticatedOperation(operationName: string) {
		return !!this.options.operationMetadata?.[operationName]?.requiresAuthentication;
	}

	protected operationUrl(operationName: string) {
		return this.options.baseURL + '/operations/' + operationName;
	}

	protected addUrlParams(url: string, queryParams: URLSearchParams): string {
		// stable stringify
		queryParams.sort();

		const queryString = this.encodeQueryParams(queryParams);

		return url + (queryString ? `?${queryString}` : '');
	}

	protected encodeQueryParams(queryParams: URLSearchParams): string {
		const originalString = queryParams.toString();
		const withoutEmptyArgs = originalString.replace('=&', '&');
		return withoutEmptyArgs.endsWith('=') ? withoutEmptyArgs.slice(0, -1) : withoutEmptyArgs;
	}

	protected searchParams(queryParams?: Record<string, string>) {
		const searchParams = new URLSearchParams(queryParams);
		if (this.options.applicationHash) {
			searchParams.set('wg_api_hash', this.options.applicationHash);
		}

		return searchParams;
	}

	protected async fetchJson(url: string, init: RequestInit = {}) {
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

		let timeout: NodeJS.Timeout | undefined;

		if (!init.signal && this.options.requestTimeoutMs && this.options.requestTimeoutMs > 0) {
			const controller = new AbortController();
			timeout = setTimeout(() => controller.abort(), this.options.requestTimeoutMs);
			init.signal = controller.signal;
		}

		// Only add credentials / mode if we are in a browser context,
		// otherwise it will throw on runtimes like Cloudflare Workers.
		const extraInit: RequestInit = typeof window !== 'undefined' ? { credentials: 'include', mode: 'cors' } : {};

		try {
			const resp = await fetchImpl(input, {
				...extraInit,
				...init,
			});
			return resp;
		} finally {
			if (timeout) {
				clearTimeout(timeout);
			}
		}
	}

	private convertGraphQLResponse(resp: GraphQLResponse, statusCode: number = 200): ClientResponse {
		// If there were no errors returned, the "errors" field should not be present on the response.
		// If no data is returned, according to the GraphQL spec,
		// the "data" field should only be included if no errors occurred during execution.
		if (resp.errors && resp.errors.length) {
			return {
				error: new ResponseError({
					statusCode,
					code: resp.errors[0]?.code,
					message: resp.errors[0]?.message,
					errors: resp.errors,
				}),
			};
		}

		if (resp.data === undefined) {
			return {
				error: new ResponseError({
					code: 'ResponseError',
					statusCode,
					message: 'Server returned no data',
				}),
			};
		}

		return {
			data: resp.data,
		};
	}

	// Determines whether the body is unparseable, plain text, or json (and assumes an invalid input if json)
	private async handleClientResponseError(response: globalThis.Response): Promise<ResponseError> {
		// In some cases, the server does not return JSON to communicate errors.
		// TODO: We should align it to always return JSON and in a consistent format.

		if (response.status === 401) {
			return new AuthorizationError();
		}

		const text = await response.text();

		try {
			const json = JSON.parse(text);

			if (response.status === 400) {
				if ((json?.code as ClientOperationErrorCodes) === 'InputValidationError') {
					const validationResult: ValidationResponseJSON = json;
					return new InputValidationError({
						errors: validationResult.errors,
						message: validationResult.message,
						statusCode: response.status,
					});
				}
			}

			return new ResponseError({
				code: json.errors[0]?.code,
				statusCode: response.status,
				errors: json.errors,
				message: json.errors[0]?.message ?? 'Invalid response from server',
			});
		} catch (e: any) {
			return new ResponseError({
				cause: e,
				statusCode: response.status,
				message: text || 'Invalid response from server',
			});
		}
	}

	/***
	 * fetchResponseToClientResponse converts a fetch response to a ClientResponse.
	 * Network errors or non-200 status codes are converted to an error. Application errors
	 * as from GraphQL are returned as an Error from type GraphQLResponseError.
	 */
	protected async fetchResponseToClientResponse(response: globalThis.Response): Promise<ClientResponse> {
		// The Promise returned from fetch() won't reject on HTTP error status
		// even if the response is an HTTP 404 or 500.

		if (!response.ok) {
			return { error: await this.handleClientResponseError(response) };
		}

		const json = await response.json();

		return this.convertGraphQLResponse(
			{
				data: json.data,
				errors: json.errors,
			},
			response.status
		);
	}

	protected stringifyInput(input: any) {
		const encoded = JSON.stringify(input || {});
		return encoded === '{}' ? undefined : encoded;
	}

	public setExtraHeaders(headers: Headers) {
		this.extraHeaders = {
			...this.extraHeaders,
			...headers,
		};
	}

	public hasExtraHeaders() {
		return Object.keys(this.extraHeaders).length > 0;
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
	public async query<RequestOptions extends QueryRequestOptions, Data = any, Error = any>(
		options: RequestOptions
	): Promise<ClientResponse<Data, Error>> {
		const params = this.searchParams();
		const variables = this.stringifyInput(options.input);
		if (variables) {
			params.set('wg_variables', variables);
		}
		if (options.subscribeOnce) {
			params.set('wg_subscribe_once', '');
		}
		const url = this.addUrlParams(this.operationUrl(options.operationName), params);
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
	public async mutate<RequestOptions extends MutationRequestOptions, Data = any, Error = any>(
		options: RequestOptions
	): Promise<ClientResponse<Data, Error>> {
		const params = this.searchParams();
		const url = this.addUrlParams(this.operationUrl(options.operationName), params);

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
		const params = this.searchParams();
		if (options?.revalidate) {
			params.set('revalidate', '');
		}
		const response = await this.fetchJson(this.addUrlParams(`${this.options.baseURL}/auth/user`, params), {
			method: 'GET',
			signal: options?.abortSignal,
		});

		if (!response.ok) {
			throw await this.handleClientResponseError(response);
		}

		if (response.status == 204) {
			// No user is signed in. Keep this in sync with pkg/authentication/authentication.go
			throw new NoUserError({ statusCode: response.status });
		}

		return response.json();
	}

	/**
	 * Set up subscriptions over SSE with fallback to web streams.
	 *
	 * Falls back to web streams if extraHeaders are set,
	 * no callback is supplied or EventSource is not supported.
	 *
	 * When called with subscribeOnce it will return the response directly
	 * without setting up a subscription.
	 * @see https://docs.wundergraph.com/docs/architecture/wundergraph-rpc-protocol-explained#subscriptions
	 */
	public async subscribe<
		RequestOptions extends SubscriptionRequestOptions,
		Data = any,
		Error = any,
		Response = ClientResponse<Data, Error>
	>(options: RequestOptions): Promise<Response>;
	public async subscribe<RequestOptions extends SubscriptionRequestOptions, Data = any, Error = any>(
		options: RequestOptions,
		cb?: SubscriptionEventHandler<Data, Error>
	): Promise<ClientResponse<Data, Error> | void>;
	public async subscribe<RequestOptions extends SubscriptionRequestOptions, Data = any, Error = any>(
		options: RequestOptions,
		cb?: SubscriptionEventHandler<Data, Error>
	): Promise<any> {
		if (options.subscribeOnce) {
			const result = await this.query<RequestOptions, Data, Error>(options);
			cb?.(result);
			return result;
		}

		const shouldUseSSE = this.options.forceSSE || !this.hasExtraHeaders();
		if (cb && 'EventSource' in globalThis && shouldUseSSE) {
			return this.subscribeWithSSE<Data, Error>(options, cb);
		}

		const generator = this.subscribeWithFetch<Data, Error>(options);

		if (cb) {
			let last: ClientResponse<Data, Error> | undefined;
			for await (const event of generator) {
				last = event;
				cb(event);
			}
			return last;
		}

		return generator;
	}

	protected subscribeWithSSE<Data = any, Error = any>(
		subscription: SubscriptionRequestOptions,
		cb: SubscriptionEventHandler<Data, Error>
	) {
		return new Promise<void>((resolve, reject) => {
			const params = this.searchParams({
				wg_sse: '',
				wg_json_patch: '',
			});
			const variables = this.stringifyInput(subscription.input);
			if (variables) {
				params.set('wg_variables', variables);
			}
			if (subscription.liveQuery) {
				params.set('wg_live', '');
			}
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
					// applyPatch deep clones the document before applying the patch
					// in that way we always ensure that the response is not cached by reference by clients / caches
					// e.g. react works with reference equality to determine if a component needs to be re-rendered
					lastResponse = applyPatch(lastResponse, jsonResp, true, false, true).newDocument as GraphQLResponse;
				} else {
					// it's not a patch, so we just set the lastResponse to the current response
					lastResponse = jsonResp as GraphQLResponse;
				}
				const clientResponse = this.convertGraphQLResponse(lastResponse);
				cb(clientResponse);
			});
			if (subscription?.abortSignal) {
				subscription?.abortSignal.addEventListener('abort', () => eventSource.close());
			}
		});
	}

	protected async fetchSubscription<Data = any, Error = any>(subscription: SubscriptionRequestOptions) {
		const params = this.searchParams({
			wg_json_patch: '',
		});
		const variables = this.stringifyInput(subscription.input);
		if (variables) {
			params.set('wg_variables', variables);
		}
		if (subscription.liveQuery) {
			params.set('wg_live', '');
		}

		const url = this.addUrlParams(this.operationUrl(subscription.operationName), params);
		return await this.fetchJson(url, {
			method: 'GET',
			signal: subscription.abortSignal,
		});
	}

	protected async *subscribeWithFetch<Data = any, Error = any>(
		subscription: SubscriptionRequestOptions
	): AsyncGenerator<ClientResponse<Data, Error>> {
		const response = await this.fetchSubscription(subscription);

		if (!response.ok || response.body === null) {
			yield {
				error: new ResponseError({
					code: 'ResponseError',
					message: `Response is not ok. Failed to subscribe to '${subscription.operationName}'`,
					statusCode: response.status,
				}) as Error,
			};
			return;
		}

		// web-streams, no support in node-fetch or Node.js yet
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let message: string = '';
		let lastResponse: GraphQLResponse | null = null;
		while (true) {
			let result: ReadableStreamReadResult<Uint8Array>;
			try {
				result = await reader.read();
			} catch (e) {
				// If we're blocked awaiting for a read when the attached
				// AbortController's abort() method is called, we'll get
				// an exception here. Make sure we swallow AbortError, but
				// nothing else.
				if (!(e instanceof Error) || e.name !== 'AbortError') {
					throw e;
				}
				result = {
					done: true,
				};
			}
			if (result.done) return;
			if (!result.value) continue;
			message += decoder.decode(result.value);
			if (message.endsWith('\n\n')) {
				const parts = message.substring(0, message.length - '\n\n'.length).split('\n\n');
				for (const part of parts) {
					const jsonResp = JSON.parse(part);
					if (lastResponse !== null && Array.isArray(jsonResp)) {
						lastResponse = applyPatch(lastResponse, jsonResp).newDocument as GraphQLResponse;
					} else {
						lastResponse = jsonResp as GraphQLResponse;
					}
					yield this.convertGraphQLResponse(lastResponse, response.status);
				}
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

		const params = this.searchParams();

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
			throw new ResponseError({
				code: 'ResponseError',
				message: `Invalid server response shape. Failed to upload files to '${config.provider}' provider`,
				statusCode: response.status,
			});
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
