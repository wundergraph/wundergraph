import hash from 'object-hash';

export type Headers = { [key: string]: string };

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export interface LogoutOptions {
	logout_openid_connect_provider?: boolean;
}

export interface ClientConfig {
	applicationHash: string;
	applicationPath: string;
	baseURL: string;
	sdkVersion: string;
	customFetch?: (input: RequestInfo, init?: RequestInit) => Promise<globalThis.Response>;
	extraHeaders?: Headers;
}

export interface User<Role> {
	provider?: string;
	provider_id?: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	first_name?: string;
	last_name?: string;
	nick_name?: string;
	description?: string;
	user_id?: string;
	avatar_url?: string;
	location?: string;
	roles?: Role[];
	custom_attributes?: string[];
	custom_claims?: {
		[key: string]: any;
	};
	access_token?: JSONObject;
	id_token?: JSONObject;
	raw_id_token?: string;
}

export class WunderGraphClient<Role> {
	constructor(config: ClientConfig) {
		this.applicationHash = config.applicationHash;
		this.applicationPath = config.applicationPath;
		this.baseURL = config.baseURL;
		this.extraHeaders = config.extraHeaders;
		this.sdkVersion = config.sdkVersion;
		this.customFetch = config.customFetch;
	}

	private readonly applicationHash: string;
	private readonly applicationPath: string;
	private readonly baseURL: string;
	private readonly sdkVersion: string;
	private csrfToken: string | undefined;
	private extraHeaders?: Headers;
	private readonly customFetch?: (input: RequestInfo, init?: RequestInit) => Promise<globalThis.Response>;

	private fetch(input: RequestInfo, init: RequestInit = {}): Promise<globalThis.Response> {
		const defaultOrCustomFetch = this.customFetch || globalThis.fetch;
		return defaultOrCustomFetch(input, {
			credentials: 'include',
			mode: 'cors',
			...init,
		});
	}

	public setExtraHeaders(headers: Headers) {
		this.extraHeaders = headers;
	}

	public cacheKey<Q extends QueryProps<any>>(query: Q): string {
		return hash(query);
	}

	public async query<Input, Data>(
		query: QueryProps<Partial<InternalQueryArgsWithInput<Input>>>
	): Promise<QueryResult<Data>> {
		try {
			const params = this.queryString({
				wg_variables: query.input,
				wg_api_hash: this.applicationHash,
				wg_subscribe_once: query.subscribeOnce,
			});
			const headers: Headers = {
				...this.extraHeaders,
				Accept: 'application/json',
				'WG-SDK-Version': this.sdkVersion,
			};
			const url = this.baseURL + '/' + this.applicationPath + '/operations/' + query.operationName + params;
			const response = await this.fetch(url, {
				headers,
				method: 'GET',
				signal: query.abortSignal,
			});
			return this.httpResponseToQueryResult(response);
		} catch (e: any) {
			return {
				status: 'error',
				errors: [
					{
						message: e.message,
					},
				],
			};
		}
	}

	public async mutate<Input, Data>(
		mutation: MutationProps<Partial<InternalMutationArgsWithInput<Input>>>
	): Promise<MutationResult<Data>> {
		try {
			const params = this.queryString({
				wg_api_hash: this.applicationHash,
			});
			const headers: Headers = {
				...this.extraHeaders,
				Accept: 'application/json',
				'WG-SDK-Version': this.sdkVersion,
			};
			if (this.csrfToken === undefined) {
				const res = await this.fetch(this.baseURL + '/' + this.applicationPath + '/auth/cookie/csrf');
				this.csrfToken = await res.text();
			}
			if (this.csrfToken !== undefined) {
				headers['X-CSRF-Token'] = this.csrfToken;
			}
			const url = this.baseURL + '/' + this.applicationPath + '/operations/' + mutation.operationName + params;
			const body = mutation.input !== undefined ? JSON.stringify(mutation.input) : '{}';
			const response = await this.fetch(url, {
				headers,
				method: 'POST',
				signal: mutation.abortSignal,
				body,
			});
			return this.httpResponseToMutationResult(response);
		} catch (e: any) {
			return {
				status: 'error',
				errors: [
					{
						message: e.message,
					},
				],
			};
		}
	}

	public subscribe = <Input, Data>(
		subscription: SubscriptionProps<Partial<InternalSubscriptionArgsWithInput<Input>>>,
		cb: (response: SubscriptionResult<Data>) => void
	) => {
		if ('EventSource' in global) {
			return this.subscribeWithSSE(subscription, cb);
		}
		return this.subscribeWithFetch(subscription, cb);
	};

	private subscribeWithSSE = <Input, Data>(
		subscription: SubscriptionProps<Partial<InternalSubscriptionArgsWithInput<Input>>>,
		cb: (result: SubscriptionResult<Data>) => void
	) => {
		(async () => {
			try {
				const params = this.queryString({
					wg_variables: subscription?.input,
					wg_live: subscription?.isLiveQuery ? true : undefined,
					wg_sse: true,
					wg_sdk_version: this.sdkVersion,
				});
				const url = this.baseURL + '/' + this.applicationPath + '/operations/' + subscription.operationName + params;
				const eventSource = new EventSource(url, {
					withCredentials: true,
				});
				eventSource.addEventListener('message', (ev) => {
					cb(this.jsonToSubscriptionResult(ev.data));
				});
				if (subscription?.abortSignal) {
					subscription?.abortSignal.addEventListener('abort', () => eventSource.close());
				}
			} catch (e: any) {
				cb({
					status: 'error',
					errors: [
						{
							message: e.message,
						},
					],
				});
			}
		})();
	};

	private subscribeWithFetch = <Input, Data>(
		subscription: SubscriptionProps<Partial<InternalSubscriptionArgsWithInput<Input>>>,
		cb: (result: SubscriptionResult<Data>) => void
	) => {
		(async () => {
			try {
				const params = this.queryString({
					wg_variables: subscription?.input,
					wg_live: subscription?.isLiveQuery ? true : undefined,
				});
				const response = await this.fetch(
					this.baseURL + '/' + this.applicationPath + '/operations/' + subscription.operationName + params,
					{
						headers: {
							...this.extraHeaders,
							'Content-Type': 'application/json',
							'WG-SDK-Version': this.sdkVersion,
						},
						method: 'GET',
						signal: subscription?.abortSignal,
					}
				);

				if (!this.isOK(response) || response.body == null) {
					cb(this.errorResult(response));
					return;
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let message: string = '';
				while (true) {
					const { value, done } = await reader.read();
					if (done) break;
					if (!value) continue;
					message += decoder.decode(value);
					if (message.endsWith('\n\n')) {
						const responseJSON = message.substring(0, message.length - 2);
						cb(this.jsonToSubscriptionResult(responseJSON));
						message = '';
					}
				}
			} catch (e: any) {
				cb({
					status: 'error',
					errors: [
						{
							message: e.message,
						},
					],
				});
			}
		})();
	};

	public uploadFiles = async <Provider extends string>(config: UploadConfig<Provider>): Promise<UploadResult> => {
		try {
			const formData = new FormData();
			for (const [key, file] of Object.entries(config.files)) {
				if (file instanceof Blob) {
					formData.append('files', file);
				}
			}
			const baseHeaders: Headers = {
				...this.extraHeaders,
				'WG-SDK-Version': this.sdkVersion,
			};
			const params = this.queryString({
				wg_api_hash: this.applicationHash,
			});
			if (this.csrfToken === undefined) {
				const res = await this.fetch(this.baseURL + '/' + this.applicationPath + '/auth/cookie/csrf', {
					headers: {
						...baseHeaders,
						Accept: 'text/plain',
					},
				});
				this.csrfToken = await res.text();
			}
			const headers: Headers = {
				...baseHeaders,
				Accept: 'application/json',
				'WG-SDK-Version': this.sdkVersion,
			};
			if (this.csrfToken) {
				headers['X-CSRF-Token'] = this.csrfToken;
			}
			const response = await this.fetch(
				this.baseURL + '/' + this.applicationPath + '/s3/' + config.provider + '/upload' + params,
				{
					headers,
					body: formData,
					method: 'POST',
					signal: config.abortSignal,
				}
			);
			if (this.isOK(response)) {
				const json = (await response.json()) as { key: string }[];
				return {
					status: 'ok',
					fileKeys: json.map((x) => x.key),
				};
			}
			return this.errorResult(response);
		} catch (e: any) {
			return {
				status: 'error',
				errors: [{ message: e.message }],
			};
		}
	};

	private isOK(response: Response) {
		return response.status === 200;
	}

	private errorResult(response: Response): ResultError {
		switch (true) {
			case response.status === 400:
				return {
					status: 'error',
					errors: [{ message: 'Bad Request' }],
				};
			case response.status >= 401 && response.status <= 499:
				return {
					status: 'error',
					errors: [{ message: 'Unauthorized' }],
				};
			case response.status >= 500 && response.status <= 599:
				return {
					status: 'error',
					errors: [{ message: 'Internal Server Error' }],
				};
			default:
				return {
					status: 'error',
					errors: [{ message: 'Unknown Error' }],
				};
		}
	}

	private httpResponseToQueryResult = async <Data>(response: Response): Promise<QueryResult<Data>> => {
		if (this.isOK(response)) {
			const responseJSON = await response.json();
			if (responseJSON.errors && !responseJSON.data) {
				return {
					status: 'error',
					errors: responseJSON.errors,
				};
			}
			if (responseJSON.errors && responseJSON.data) {
				return {
					status: 'partial',
					errors: responseJSON.errors,
					data: responseJSON.data,
				};
			}
			return {
				status: 'ok',
				data: responseJSON.data,
			};
		}

		return this.errorResult(response);
	};

	private httpResponseToMutationResult = async <Data>(response: Response): Promise<MutationResult<Data>> => {
		if (this.isOK(response)) {
			const responseJSON = await response.json();
			if (responseJSON.errors && !responseJSON.data) {
				return {
					status: 'error',
					errors: responseJSON.errors,
				};
			}
			if (responseJSON.errors && responseJSON.data) {
				return {
					status: 'partial',
					errors: responseJSON.errors,
					data: responseJSON.data,
				};
			}
			return {
				status: 'ok',
				data: responseJSON.data,
			};
		}

		return this.errorResult(response);
	};

	private jsonToSubscriptionResult = <Data>(json: any): SubscriptionResult<Data> => {
		const responseJSON = JSON.parse(json);
		if (responseJSON.errors && !responseJSON.data) {
			return {
				status: 'error',
				errors: responseJSON.errors,
			};
		}
		if (responseJSON.errors && responseJSON.data) {
			return {
				status: 'partial',
				errors: responseJSON.errors,
				data: responseJSON.data,
			};
		}
		if (responseJSON.data) {
			return {
				status: 'ok',
				streamState: 'streaming',
				data: responseJSON.data,
			};
		}
		return {
			status: 'error',
			errors: [{ message: 'Unexpected response' }],
		};
	};

	public fetchUser = async (abortSignal?: AbortSignal, revalidate?: boolean): Promise<User<Role> | null> => {
		try {
			const revalidateTrailer = revalidate === undefined ? '' : '?revalidate=true';
			const response = await this.fetch(
				this.baseURL + '/' + this.applicationPath + '/auth/cookie/user' + revalidateTrailer,
				{
					headers: {
						...this.extraHeaders,
						'Content-Type': 'application/json',
						'WG-SDK-Version': this.sdkVersion,
					},
					method: 'GET',
					signal: abortSignal,
				}
			);
			if (this.isOK(response)) {
				return response.json();
			}
		} catch (e: any) {
			throw e;
		}
		return null;
	};

	public login = (authProviderID: string, redirectURI?: string) => {
		// not implemented on server
		if (typeof window === 'undefined') {
			return;
		}

		const query = this.queryString({
			redirect_uri: redirectURI || window.location.toString(),
		});
		window.location.assign(`${this.baseURL}/${this.applicationPath}/auth/cookie/authorize/${authProviderID}${query}`);
	};

	public logout = async (options?: LogoutOptions): Promise<boolean> => {
		const response = await this.fetch(
			this.baseURL + '/' + this.applicationPath + '/auth/cookie/user/logout' + this.queryString(options),
			{
				headers: {
					...this.extraHeaders,
					'Content-Type': 'application/json',
					'WG-SDK-Version': this.sdkVersion,
				},
				method: 'GET',
			}
		);
		return this.isOK(response);
	};

	private queryString = (input?: object): string => {
		if (!input) {
			return '';
		}
		const query = (Object.keys(input) as Array<keyof typeof input>)
			.filter((key) => input[key] !== undefined && input[key] !== '')
			.map((key) => {
				const value = typeof input[key] === 'object' ? JSON.stringify(input[key]) : input[key];
				const encodedKey = encodeURIComponent(key);
				const encodedValue = encodeURIComponent(value);
				return `${encodedKey}=${encodedValue}`;
			})
			.join('&');
		return query === '' ? query : '?' + query;
	};
}

export interface WithWunderGraphOptions {
	baseURL?: string;
	logPrerenderTime?: boolean;
	disableFetchUserServerSide?: boolean;
	disableFetchUserClientSide?: boolean;
	disableFetchUserOnWindowFocus?: boolean;
}

export interface QueryArgs {
	disableSSR?: boolean;
	lazy?: boolean;
	debounceMillis?: number;
	refetchOnWindowFocus?: boolean;
}

export interface InternalQueryArgs extends QueryArgs {
	abortSignal?: AbortSignal;
	subscribeOnce?: boolean;
}

export interface InternalQueryArgsWithInput<Input> extends InternalQueryArgs {
	input: Input;
}

export interface QueryArgsWithInput<Input> extends QueryArgs {
	input: Input;
}

export type QueryProps<Args extends QueryArgs = QueryArgs> = Args & {
	operationName: string;
};

export type SubscriptionProps<Args extends SubscriptionArgs = SubscriptionArgs> = Args & {
	operationName: string;
};

export interface SubscriptionArgs {
	stopOnWindowBlur?: boolean;
	debounceMillis?: number;
	disableSSR?: boolean;
}

export interface InternalSubscriptionArgs extends SubscriptionArgs {
	abortSignal?: AbortSignal;
	subscribeOnce?: boolean;
	isLiveQuery?: boolean;
}

export interface InternalSubscriptionArgsWithInput<Input> extends InternalSubscriptionArgs {
	input: Input;
}

export interface SubscriptionArgsWithInput<Input> extends SubscriptionArgs {
	input: Input;
}

export type MutationProps<Args extends MutationArgs = MutationArgs> = Args & {
	operationName: string;
};

export interface MutationArgs {
	refetchMountedOperationsOnSuccess?: boolean;
}

export interface InternalMutationArgs extends MutationArgs {
	abortSignal?: AbortSignal;
}

export interface InternalMutationArgsWithInput<Input> extends InternalMutationArgs {
	input: Input;
}

export interface MutationArgsWithInput<Input> extends MutationArgs {
	input: Input;
}

export interface GraphQLError {
	message: string;
	path?: ReadonlyArray<string | number>;
}

export interface ResultOK<Data> {
	status: 'ok';
	refetching?: boolean;
	data: Data;
}

export interface ResultRequiresAuthentication {
	status: 'requires_authentication';
}

export interface ResultNone {
	status: 'none';
}

export interface ResultLazy {
	status: 'lazy';
}

export interface ResultCancelled {
	status: 'cancelled';
}

export interface ResultLoading {
	status: 'loading';
}

export interface ResultPartial<Data> {
	status: 'partial';
	data: Data;
	errors: ReadonlyArray<GraphQLError>;
}

export interface ResultError {
	status: 'error';
	errors: ReadonlyArray<GraphQLError>;
}

export type SubscriptionResult<Data> =
	| SubscriptionResultOK<Data>
	| ResultError
	| ResultPartial<Data>
	| ResultLoading
	| ResultNone
	| ResultRequiresAuthentication;

export interface SubscriptionResultOK<Data> extends ResultOK<Data> {
	streamState: 'streaming' | 'stopped' | 'restarting';
}

export type QueryResult<Data> =
	| QueryResultOK<Data>
	| ResultPartial<Data>
	| ResultLazy
	| ResultError
	| ResultLoading
	| ResultCancelled
	| ResultNone
	| ResultRequiresAuthentication;

export interface QueryResultOK<Data> extends ResultOK<Data> {
	refetching?: boolean;
}

export type MutationResult<Data> =
	| ResultNone
	| ResultLoading
	| ResultOK<Data>
	| ResultPartial<Data>
	| ResultError
	| ResultRequiresAuthentication;

export type UploadResult = UploadResultOK | ResultError;

export interface UploadResultOK {
	status: 'ok';
	fileKeys: string[];
}

export interface UploadResponseError {
	status: 'error';
	message: string;
}

export interface UploadConfig<Provider extends string> {
	provider: Provider;
	files: FileList;
	abortSignal?: AbortSignal;
}
