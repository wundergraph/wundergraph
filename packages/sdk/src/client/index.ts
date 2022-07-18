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

	public setExtraHeaders(headers: Headers) {
		this.extraHeaders = headers;
	}

	public cacheKey<Q extends QueryProps, Args extends InternalQueryArgs, Data>(query: Q, args?: Args): string {
		return hash({
			query,
			args,
		});
	}

	public async query<Q extends QueryProps, Input, Data>(
		query: Q,
		args?: InternalQueryArgs
	): Promise<QueryResult<Data>> {
		try {
			const params = this.queryString({
				wg_variables: args?.input,
				wg_api_hash: this.applicationHash,
				wg_subscribe_once: args?.subscribeOnce,
			});
			const headers: Headers = {
				...this.extraHeaders,
				Accept: 'application/json',
				'WG-SDK-Version': this.sdkVersion,
			};
			const defaultOrCustomFetch = this.customFetch || globalThis.fetch;
			const url = this.baseURL + '/' + this.applicationPath + '/operations/' + query.operationName + params;
			const response = await defaultOrCustomFetch(url, {
				headers,
				method: 'GET',
				credentials: 'include',
				mode: 'cors',
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

	public async mutate<P extends MutationProps, Data, Input = never>(
		mutation: P,
		args?: InternalMutationArgsWithInput<Input>
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
			const defaultOrCustomFetch = this.customFetch || globalThis.fetch;
			if (this.csrfToken === undefined) {
				const res = await defaultOrCustomFetch(this.baseURL + '/' + this.applicationPath + '/auth/cookie/csrf', {
					credentials: 'include',
					mode: 'cors',
				});
				this.csrfToken = await res.text();
			}
			if (this.csrfToken !== undefined) {
				headers['X-CSRF-Token'] = this.csrfToken;
			}
			const url = this.baseURL + '/' + this.applicationPath + '/operations/' + mutation.operationName + params;
			const body = args?.input !== undefined ? JSON.stringify(args.input) : '{}';
			const response = await defaultOrCustomFetch(url, {
				headers,
				method: 'POST',
				credentials: 'include',
				mode: 'cors',
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

	public subscribe = <S extends SubscriptionProps, Input, Data>(
		subscription: S,
		cb: (response: SubscriptionResult<Data>) => void,
		args?: InternalSubscriptionArgs
	) => {
		if ('EventSource' in global) {
			return this.subscribeWithSSE(subscription, cb, args);
		}
		return this.subscribeWithFetch(subscription, cb, args);
	};

	private subscribeWithSSE = <S extends SubscriptionProps, Input, Data>(
		subscription: S,
		cb: (result: SubscriptionResult<Data>) => void,
		args?: InternalSubscriptionArgs
	) => {
		(async () => {
			try {
				const params = this.queryString({
					wg_variables: args?.input,
					wg_live: subscription.isLiveQuery ? true : undefined,
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
				if (args?.abortSignal) {
					args.abortSignal.addEventListener('abort', () => eventSource.close());
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

	private subscribeWithFetch = <S extends SubscriptionProps, Input, Data>(
		subscription: S,
		cb: (result: SubscriptionResult<Data>) => void,
		args?: InternalSubscriptionArgs
	) => {
		(async () => {
			try {
				const params = this.queryString({
					wg_variables: args?.input,
					wg_live: subscription.isLiveQuery ? true : undefined,
				});
				const f = this.customFetch || fetch;
				const response = await f(
					this.baseURL + '/' + this.applicationPath + '/operations/' + subscription.operationName + params,
					{
						headers: {
							...this.extraHeaders,
							'Content-Type': 'application/json',
							'WG-SDK-Version': this.sdkVersion,
						},
						method: 'GET',
						signal: args?.abortSignal,
						credentials: 'include',
						mode: 'cors',
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
				const res = await fetch(this.baseURL + '/' + this.applicationPath + '/auth/cookie/csrf', {
					headers: {
						...baseHeaders,
						Accept: 'text/plain',
					},
					credentials: 'include',
					mode: 'cors',
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
			const f = this.customFetch || fetch;
			const response = await f(
				this.baseURL + '/' + this.applicationPath + '/s3/' + config.provider + '/upload' + params,
				{
					headers,
					body: formData,
					method: 'POST',
					signal: config.abortSignal,
					credentials: 'include',
					mode: 'cors',
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
			const response = await fetch(
				this.baseURL + '/' + this.applicationPath + '/auth/cookie/user' + revalidateTrailer,
				{
					headers: {
						...this.extraHeaders,
						'Content-Type': 'application/json',
						'WG-SDK-Version': this.sdkVersion,
					},
					method: 'GET',
					credentials: 'include',
					mode: 'cors',
					signal: abortSignal,
				}
			);
			if (this.isOK(response)) {
				return response.json();
			}
		} catch {}
		return null;
	};

	public login = (authProviderID: string, redirectURI?: string) => {
		const query = this.queryString({
			redirect_uri: redirectURI || window.location.toString(),
		});
		window.location.assign(`${this.baseURL}/${this.applicationPath}/auth/cookie/authorize/${authProviderID}${query}`);
	};

	public logout = async (options?: LogoutOptions): Promise<boolean> => {
		const response = await fetch(
			this.baseURL + '/' + this.applicationPath + '/auth/cookie/user/logout' + this.queryString(options),
			{
				headers: {
					...this.extraHeaders,
					'Content-Type': 'application/json',
					'WG-SDK-Version': this.sdkVersion,
				},
				method: 'GET',
				credentials: 'include',
				mode: 'cors',
			}
		);
		return this.isOK(response);
	};

	private queryString = (input?: Object): string => {
		if (!input) {
			return '';
		}
		const query = (Object.keys(input) as Array<keyof typeof input>)
			// @ts-ignore
			.filter((key) => input[key] !== undefined && input[key] !== '')
			.map((key) => {
				const value = typeof input[key] === 'object' ? JSON.stringify(input[key]) : input[key];
				const encodedKey = encodeURIComponent(key);
				// @ts-ignore
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

export interface InternalQueryArgs {
	input?: any;
	abortSignal?: AbortSignal;
	subscribeOnce?: boolean;
	disableSSR?: boolean;
	lazy?: boolean;
	debounceMillis?: number;
	refetchOnWindowFocus?: boolean;
}

export interface QueryArgs {
	disableSSR?: boolean;
	lazy?: boolean;
	debounceMillis?: number;
	refetchOnWindowFocus?: boolean;
}

export interface InternalQueryArgsWithInput<Input> extends InternalQueryArgs {
	input: Input;
}

export interface QueryArgsWithInput<Input> extends QueryArgs {
	input: Input;
}

export interface QueryProps {
	operationName: string;
	requiresAuthentication: boolean;
}

export interface SubscriptionProps {
	operationName: string;
	isLiveQuery: boolean;
	requiresAuthentication: boolean;
}

export interface InternalSubscriptionArgs {
	input?: any;
	abortSignal?: AbortSignal;
	subscribeOnce?: boolean;
	stopOnWindowBlur?: boolean;
	debounceMillis?: number;
	disableSSR?: boolean;
}

export interface SubscriptionArgs {
	stopOnWindowBlur?: boolean;
	debounceMillis?: number;
	disableSSR?: boolean;
}

export interface InternalSubscriptionArgsWithInput<Input> extends InternalSubscriptionArgs {
	input: Input;
}

export interface SubscriptionArgsWithInput<Input> extends SubscriptionArgs {
	input: Input;
}

export interface MutationProps {
	operationName: string;
	requiresAuthentication: boolean;
}

export interface InternalMutationArgs {
	abortSignal?: AbortSignal;
	refetchMountedOperationsOnSuccess?: boolean;
}

export interface MutationArgs {
	refetchMountedOperationsOnSuccess?: boolean;
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
