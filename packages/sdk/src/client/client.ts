import {
	ClientConfig,
	ClientResponse,
	FetchUserRequestOptions,
	GraphQLResponse,
	Headers,
	LogoutOptions,
	OperationRequestOptions,
	SubscriptionEventHandler,
	SubscriptionRequestOptions,
	UploadRequestOptions,
	UploadResponse,
	User,
} from './types';
import { serialize } from '../utils/serialize';
import { GraphQLResponseError } from './GraphQLResponseError';

// https://graphql.org/learn/serving-over-http/

export class Client {
	constructor(private options: ClientConfig) {
		this.baseHeaders = {
			'WG-SDK-Version': options.sdkVersion,
		};
	}

	private readonly baseHeaders: Headers = {};
	private extraHeaders: Headers = {};
	private csrfToken: string | undefined;

	public static buildCacheKey(query: OperationRequestOptions): string {
		return serialize(query);
	}

	private operationUrl(operationName: string) {
		return this.options.baseURL + '/' + this.options.applicationPath + '/operations/' + operationName;
	}

	private addUrlParams(url: string, queryParams: URLSearchParams): string {
		// avoid stringify to 'undefined'
		for (const [key, value] of queryParams.entries()) {
			if (value == '') {
				queryParams.delete(key);
			}
		}

		// stable stringify
		queryParams.sort();

		return url + '?' + queryParams.toString();
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
				error: new Error('Invalid response from the server'),
			};
		}

		return {
			data: resp.data,
		};
	}

	private async fetchResponseToClientResponse(resp: globalThis.Response): Promise<ClientResponse> {
		// The Promise returned from fetch() won't reject on HTTP error status
		// even if the response is an HTTP 404 or 500.
		if (!resp.ok) {
			return {
				data: null,
				error: new Error(`HTTP Error: ${resp.status}`),
			};
		}

		const json = await resp.json();

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

	public async query<RequestOptions extends OperationRequestOptions, ResponseData = any>(
		options: RequestOptions
	): Promise<ClientResponse<ResponseData>> {
		const url = this.addUrlParams(
			this.operationUrl(options.operationName),
			new URLSearchParams({
				wg_variables: this.stringifyInput(options.input),
				wg_api_hash: this.options.applicationHash,
			})
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
			const res = await this.fetch(this.options.baseURL + '/' + this.options.applicationPath + '/auth/cookie/csrf', {
				headers: {
					...this.baseHeaders,
					Accept: 'text/plain',
				},
			});
			this.csrfToken = await res.text();

			if (!this.csrfToken) {
				throw new Error('Failed to get CSRF token');
			}
		}
		return this.csrfToken;
	}

	public async mutate<RequestOptions extends OperationRequestOptions, ResponseData = any>(
		options: RequestOptions
	): Promise<ClientResponse<ResponseData>> {
		const url = this.addUrlParams(
			this.operationUrl(options.operationName),
			new URLSearchParams({
				wg_api_hash: this.options.applicationHash,
			})
		);

		const headers: Headers = {};

		if (
			this.options.operationMetadata &&
			this.options.operationMetadata[options.operationName] &&
			this.options.operationMetadata[options.operationName].requiresAuthentication
		) {
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

	public async fetchUser<U extends User>(options?: FetchUserRequestOptions): Promise<U> {
		const params = new URLSearchParams({
			revalidate: options?.revalidate ? 'true' : 'false',
		});

		const response = await this.fetchJson(
			this.addUrlParams(`${this.options.baseURL}/${this.options.applicationPath}/auth/cookie/user`, params),
			{
				method: 'GET',
				signal: options?.abortSignal,
			}
		);
		if (!response.ok) {
			throw new Error(`HTTP Error: ${response.status}`);
		}

		return response.json();
	}

	public async subscribe<RequestOptions extends SubscriptionRequestOptions, ResponseData extends any>(
		subscription: RequestOptions,
		cb: SubscriptionEventHandler<ResponseData>
	) {
		if ('EventSource' in globalThis) {
			return this.subscribeWithSSE<ResponseData>(subscription, cb);
		}
		for await (const event of this.subscribeWithFetch<ResponseData>(subscription)) {
			cb(event);
		}
	}

	private subscribeWithSSE<ResponseData = any>(
		subscription: SubscriptionRequestOptions,
		cb: SubscriptionEventHandler<ResponseData>
	) {
		const params = new URLSearchParams({
			wg_variables: this.stringifyInput(subscription.input),
			wg_live: subscription?.liveQuery ? 'true' : 'false',
			wg_sse: 'true',
		});
		const url = this.addUrlParams(this.operationUrl(subscription.operationName), params);
		const eventSource = new EventSource(url, {
			withCredentials: true,
		});
		eventSource.addEventListener('message', (ev) => {
			const jsonResp = JSON.parse(ev.data);
			cb(this.convertGraphQLResponse(jsonResp));
		});
		if (subscription?.abortSignal) {
			subscription?.abortSignal.addEventListener('abort', () => eventSource.close());
		}
	}

	private async *subscribeWithFetch<ResponseData = any>(
		subscription: SubscriptionRequestOptions
	): AsyncGenerator<ClientResponse<ResponseData>> {
		const params = new URLSearchParams({
			wg_variables: this.stringifyInput(subscription.input),
			wg_live: subscription?.liveQuery ? 'true' : 'false',
		});
		const url = this.addUrlParams(this.operationUrl(subscription.operationName), params);
		const response = await this.fetchJson(url, {
			method: 'GET',
			signal: subscription.abortSignal,
		});

		if (!response.ok || response.body === null) {
			yield {
				error: new Error(`HTTP Error: ${response.status}`),
			};
			return;
		}

		// web-streams, no support in node-fetch or Node.js yet
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let message: string = '';
		while (true) {
			const { value, done } = await reader.read();
			if (done) return;
			if (!value) continue;
			message += decoder.decode(value);
			if (message.endsWith('\n\n')) {
				const responseJSON = JSON.parse(message.substring(0, message.length - 2));
				yield this.convertGraphQLResponse(responseJSON);
				message = '';
			}
		}
	}

	/**
	 * Uploads one or more files to the server. Authentication is required. The method throws an error if the files
	 * could not be uploaded for any reason. If the upload was successful, your return a list
	 * of file IDs that can be used to download the files from your S3 bucket.
	 */
	public async uploadFiles(config: UploadRequestOptions): Promise<UploadResponse> {
		const formData = new FormData();
		for (const [_, file] of Object.entries(config.files)) {
			if (file instanceof Blob) {
				formData.append('files', file);
			}
		}
		const csrfToken = await this.getCSRFToken();

		const params = new URLSearchParams({
			wg_api_hash: this.options.applicationHash,
		});

		const response = await this.fetch(
			this.addUrlParams(`${this.options.baseURL}/${this.options.applicationPath}/s3/${config.provider}/upload`, params),
			{
				headers: {
					// Dont set the content-type header, the browser will set it for us + boundary
					'X-CSRF-Token': csrfToken,
				},
				body: formData,
				method: 'POST',
				signal: config.abortSignal,
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP Error: ${response.status}`);
		}

		const result = await response.json();
		if (!result.data) {
			throw new Error('Invalid server response');
		}

		const json = result.data as { key: string }[];
		return {
			fileKeys: json.map((x) => x.key),
		};
	}

	public login = (authProviderID: string, redirectURI?: string) => {
		// browser check
		if (typeof window === 'undefined') {
			throw new Error('login() can only be called in a browser environment');
		}

		const params = new URLSearchParams({
			redirect_uri: redirectURI || window.location.toString(),
		});

		const url = this.addUrlParams(
			`${this.options.baseURL}/${this.options.applicationPath}/auth/cookie/authorize/${authProviderID}`,
			params
		);

		window.location.assign(url);
	};

	public logout = async (options?: LogoutOptions): Promise<boolean> => {
		const params = new URLSearchParams({
			logout_openid_connect_provider: options?.logoutOpenidConnectProvider ? 'true' : 'false',
		});

		const url = this.addUrlParams(
			`${this.options.baseURL}/${this.options.applicationPath}/auth/cookie/user/logout`,
			params
		);

		const response = await this.fetch(url, {
			method: 'GET',
		});

		return response.ok;
	};
}
