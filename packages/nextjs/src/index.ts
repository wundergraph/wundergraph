/**
 * Important: This file must be compatible with Next.js https://nextjs.org/docs/api-reference/edge-runtime
 */

import type { NextPage, NextPageContext } from 'next';
import type NextApp from 'next/app';
import {
	Context,
	createElement,
	Dispatch,
	ReactElement,
	ReactNode,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import ssrPrepass from 'react-ssr-prepass';
import hash from 'object-hash';

export type Headers = { [key: string]: string };

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export interface LogoutOptions {
	logout_openid_connect_provider?: boolean;
}

export interface WunderGraphContextProperties<Role> {
	ssrCache: { [key: string]: Promise<any> | {} };
	clientConfig: ClientConfig<Role>;
	client: Client<Role>;
	user: User<Role> | null;
	setUser: Dispatch<SetStateAction<User<Role> | null>>;
	isWindowFocused: 'pristine' | 'focused' | 'blurred';
	setIsWindowFocused: Dispatch<SetStateAction<'pristine' | 'focused' | 'blurred'>>;
	refetchMountedOperations: number;
	setRefetchMountedOperations: Dispatch<SetStateAction<number>>;
}

export interface ClientConfig<Role> {
	applicationHash: string;
	applicationPath: string;
	baseURL: string;
	sdkVersion: string;
	authenticationEnabled: boolean;
	customFetch?: (input: RequestInfo, init?: RequestInit) => Promise<globalThis.Response>;
	extraHeaders?: Headers;
	user?: User<Role>;
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

export type UploadResponse = UploadResponseOk | UploadResponseError;

export interface UploadResponseOk {
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

export class Client<Role> {
	constructor(config: ClientConfig<Role>) {
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
		cb: (response: SubscriptionResult<Data>) => void,
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
					cb(this.jsonToSubscriptionResponse(ev.data));
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
		cb: (response: SubscriptionResult<Data>) => void,
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
				if (response.status === 400) {
					cb({
						status: 'error',
						errors: [{ message: 'Bad Request' }],
					});
					return;
				}
				if (response.status >= 401 && response.status <= 499) {
					cb({
						status: 'error',
						errors: [{ message: 'Unauthorized' }],
					});
					return;
				}
				if (response.status >= 500 && response.status <= 599) {
					cb({
						status: 'error',
						errors: [{ message: 'Server Error' }],
					});
					return;
				}
				if (response.status !== 200 || response.body == null) {
					cb({
						status: 'error',
						errors: [{ message: 'Unknown Error' }],
					});
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
						cb(this.jsonToSubscriptionResponse(responseJSON));
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

	public uploadFiles = async <Provider extends string>(config: UploadConfig<Provider>): Promise<UploadResponse> => {
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
			const res = await f(this.baseURL + '/' + this.applicationPath + '/s3/' + config.provider + '/upload' + params, {
				headers,
				body: formData,
				method: 'POST',
				signal: config.abortSignal,
				credentials: 'include',
				mode: 'cors',
			});
			if (res.status === 400) {
				return {
					status: 'error',
					message: 'Bad Request',
				};
			}
			if (res.status >= 401 && res.status <= 499) {
				return {
					status: 'error',
					message: 'Unauthorized',
				};
			}
			if (res.status >= 500 && res.status <= 599) {
				return {
					status: 'error',
					message: 'Server Error',
				};
			}
			if (res.status === 200) {
				const json = (await res.json()) as { key: string }[];
				return {
					status: 'ok',
					fileKeys: json.map((x) => x.key),
				};
			}
			return {
				status: 'error',
				message: 'Unknown Error',
			};
		} catch (e: any) {
			return {
				status: 'error',
				message: e.message,
			};
		}
	};

	private httpResponseToQueryResult = async <Data>(response: Response): Promise<QueryResult<Data>> => {
		switch (true) {
			case response.status === 200:
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
	};

	private httpResponseToMutationResult = async <Data>(response: Response): Promise<MutationResult<Data>> => {
		switch (true) {
			case response.status === 200:
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
	};

	private jsonToSubscriptionResponse = <Data>(json: any): SubscriptionResult<Data> => {
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
			if (response.status === 200) {
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
		return response.status === 200;
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

type NextPageWithLayout = NextPage & {
	getLayout?: (page: ReactElement) => ReactNode;
};

function withWunderGraphContextWrapper<Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	defaultContextProperties: WunderGraphContextProperties<Role>
) {
	return <C extends NextPage<any> | NextApp>(Page: C, options?: WithWunderGraphOptions) => {
		// initialize the client
		if (defaultContextProperties.client === null) {
			const baseOptions = { ...defaultContextProperties.clientConfig };
			if (options?.baseURL) {
				baseOptions.baseURL = options.baseURL;
			}
			defaultContextProperties.client = new Client(baseOptions);
		}

		const WithWunderGraph: NextPage<any> = (props: any) => {
			const isClient = typeof window !== 'undefined';
			if (isClient) {
				const [user, setUser] = useState<User<Role> | null>(props.user || null);
				const [isWindowFocused, setIsWindowFocused] = useState<'pristine' | 'focused' | 'blurred'>('pristine');
				const [refetchMountedOperations, setRefetchMountedOperations] = useState<number>(0);
				windowHooks(setIsWindowFocused);
				if (defaultContextProperties.clientConfig.authenticationEnabled) {
					clientUserHooks<Role>(user, setUser, isWindowFocused, defaultContextProperties, options);
				}
				const clientProps: WunderGraphContextProperties<Role> = {
					...defaultContextProperties,
					ssrCache: props.ssrCache || { _client_defined_cache: true },
					user,
					setUser,
					isWindowFocused,
					setIsWindowFocused,
					refetchMountedOperations,
					setRefetchMountedOperations,
				};
				return createElement(wunderGraphContext.Provider, { value: clientProps }, createElement(Page as any, props));
			}
			const ssrProps: WunderGraphContextProperties<Role> = {
				...defaultContextProperties,
				ssrCache: props.ssrCache || {},
				user: props.user || null,
			};
			return createElement(
				wunderGraphContext.Provider,
				{
					value: ssrProps,
				},
				createElement(Page as any, props)
			);
		};
		WithWunderGraph.displayName = (Page as any).displayName || (Page as NextPage).name || 'WithWunderGraph';
		if ((Page as NextPageWithLayout).getLayout) {
			// @ts-ignore
			WithWunderGraph.getLayout = (Page as NextPageWithLayout).getLayout;
		}
		WithWunderGraph.getInitialProps = async (ctx: NextPageContext) => {
			const pageProps = (Page as NextPage).getInitialProps ? await (Page as NextPage).getInitialProps!(ctx as any) : {};
			const ssrCache: { [key: string]: any } = {};

			if (typeof window !== 'undefined') {
				// we're on the client
				// no need to do all the SSR stuff
				return { ...pageProps, ssrCache };
			}

			const cookieHeader = ctx.req?.headers.cookie;
			if (typeof cookieHeader === 'string') {
				defaultContextProperties.client.setExtraHeaders({
					Cookie: cookieHeader,
				});
			}

			let ssrUser: User<Role> | null = null;

			if (options?.disableFetchUserServerSide !== true && defaultContextProperties.clientConfig.authenticationEnabled) {
				try {
					ssrUser = await defaultContextProperties.client.fetchUser();
				} catch (e) {}
			}

			const AppTree = ctx.AppTree;
			const start = options?.logPrerenderTime ? process.hrtime() : undefined;

			const App = createElement(
				wunderGraphContext.Provider,
				{
					value: {
						...defaultContextProperties,
						user: ssrUser,
						ssrCache,
					},
				},
				createElement(AppTree, {
					pageProps: {
						...pageProps,
						ssrCache,
						user: ssrUser,
					},
				})
			);

			await ssrPrepass(App);
			const keys = Object.keys(ssrCache)
				.filter((key) => typeof ssrCache[key].then === 'function')
				.map((key) => ({
					key,
					value: ssrCache[key],
				})) as { key: string; value: Promise<any> }[];
			if (keys.length !== 0) {
				const promises = keys.map((key) => key.value);
				const results = await Promise.all(promises);
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i].key;
					ssrCache[key] = results[i];
				}
			}

			if (options?.logPrerenderTime && start) {
				const precision = 3; // 3 decimal places
				const elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
				console.log(process.hrtime(start)[0] + ' s, ' + elapsed.toFixed(precision) + ' ms - render'); // print message + time
			}

			return { ...pageProps, ssrCache, user: ssrUser };
		};
		return WithWunderGraph;
	};
}

const windowHooks = (setIsWindowFocused: Dispatch<SetStateAction<'pristine' | 'focused' | 'blurred'>>) => {
	useEffect(() => {
		const onFocus = () => {
			setIsWindowFocused('focused');
		};
		const onBlur = () => {
			setIsWindowFocused('blurred');
		};
		window.addEventListener('focus', onFocus);
		window.addEventListener('blur', onBlur);
		return () => {
			window.removeEventListener('focus', onFocus);
			window.removeEventListener('blur', onBlur);
		};
	}, []);
};

const clientUserHooks = <Role>(
	user: User<Role> | null,
	setUser: Dispatch<SetStateAction<User<Role> | null>>,
	isWindowFocused: 'pristine' | 'focused' | 'blurred',
	ctx: WunderGraphContextProperties<Role>,
	options?: WithWunderGraphOptions
) => {
	const [disableFetchUserClientSide] = useState(options?.disableFetchUserClientSide === true);
	const [disableFetchUserOnWindowFocus] = useState(options?.disableFetchUserOnWindowFocus === true);
	useEffect(() => {
		if (disableFetchUserClientSide) {
			return;
		}
		const abort = new AbortController();
		if (user === null) {
			(async () => {
				try {
					const nextUser = await ctx.client.fetchUser(abort.signal);
					if (JSON.stringify(nextUser) === JSON.stringify(user)) {
						return;
					}
					setUser(nextUser);
				} catch (e) {}
			})();
		}
		return () => {
			abort.abort();
		};
	}, [disableFetchUserClientSide]);
	useEffect(() => {
		if (disableFetchUserClientSide) {
			return;
		}
		if (disableFetchUserOnWindowFocus) {
			return;
		}
		if (isWindowFocused !== 'focused') {
			return;
		}
		const abort = new AbortController();
		(async () => {
			try {
				const nextUser = await ctx.client.fetchUser(abort.signal);
				if (JSON.stringify(nextUser) === JSON.stringify(user)) {
					return;
				}
				setUser(nextUser);
			} catch (e) {}
		})();
		return () => {
			abort.abort();
		};
	}, [isWindowFocused, disableFetchUserClientSide, disableFetchUserOnWindowFocus]);
};

interface InternalQueryArgs {
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

interface InternalQueryArgsWithInput<Input> extends InternalQueryArgs {
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

interface InternalSubscriptionArgs {
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

interface InternalSubscriptionArgsWithInput<Input> extends InternalSubscriptionArgs {
	input: Input;
}

export interface SubscriptionArgsWithInput<Input> extends SubscriptionArgs {
	input: Input;
}

export interface MutationProps {
	operationName: string;
	requiresAuthentication: boolean;
}

interface InternalMutationArgs {
	abortSignal?: AbortSignal;
	refetchMountedOperationsOnSuccess?: boolean;
}

export interface MutationArgs {
	refetchMountedOperationsOnSuccess?: boolean;
}

interface InternalMutationArgsWithInput<Input> extends InternalMutationArgs {
	input: Input;
}

export interface MutationArgsWithInput<Input> extends MutationArgs {
	input: Input;
}

export type SubscriptionResult<Data> =
	| SubscriptionResultOK<Data>
	| SubscriptionResultError
	| SubscriptionResultPartial<Data>
	| SubscriptionResultLoading
	| SubscriptionResultNone
	| SubscriptionResultRequiresAuthentication;

export interface SubscriptionResultOK<Data> {
	status: 'ok';
	streamState: 'streaming' | 'stopped' | 'restarting';
	data: Data;
}

export interface SubscriptionResultRequiresAuthentication {
	status: 'requires_authentication';
}

export interface SubscriptionResultNone {
	status: 'none';
}

export interface SubscriptionResultLoading {
	status: 'loading';
}

export interface SubscriptionResultError {
	status: 'error';
	errors: ReadonlyArray<GraphQLError>;
}

export interface SubscriptionResultPartial<Data> {
	status: 'partial';
	data: Data;
	errors: ReadonlyArray<GraphQLError>;
}

export interface GraphQLError {
	message: string;
	path?: ReadonlyArray<string | number>;
}

export type QueryResult<Data> =
	| QueryResultOK<Data>
	| QueryResultPartial<Data>
	| QueryResultLazy
	| QueryResultError
	| QueryResultLoading
	| QueryResultCancelled
	| QueryResultNone
	| QueryResultRequiresAuthentication;

export interface QueryResultOK<Data> {
	status: 'ok';
	refetching?: boolean;
	data: Data;
}

export interface QueryResultRequiresAuthentication {
	status: 'requires_authentication';
}

export interface QueryResultNone {
	status: 'none';
}

export interface QueryResultLazy {
	status: 'lazy';
}

export interface QueryResultCancelled {
	status: 'cancelled';
}

export interface QueryResultLoading {
	status: 'loading';
}

export interface QueryResultPartial<Data> {
	status: 'partial';
	data: Data;
	errors: ReadonlyArray<GraphQLError>;
}

export interface QueryResultError {
	status: 'error';
	errors: ReadonlyArray<GraphQLError>;
}

export type MutationResult<Data> =
	| MutationResultNone
	| MutationResultLoading
	| MutationResultOK<Data>
	| MutationResultPartial<Data>
	| MutationResultError
	| MutationResultRequiresAuthentication;

export interface MutationResultOK<Data> {
	status: 'ok';
	data: Data;
}

export interface MutationResultRequiresAuthentication {
	status: 'requires_authentication';
}

export interface MutationResultNone {
	status: 'none';
}

export interface MutationResultLoading {
	status: 'loading';
}

export interface MutationResultPartial<Data> {
	status: 'partial';
	data: Data;
	errors: ReadonlyArray<GraphQLError>;
}

export interface MutationResultError {
	status: 'error';
	errors: ReadonlyArray<GraphQLError>;
}

function useQueryContextWrapper<Input, Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	query: QueryProps,
	args?: InternalQueryArgsWithInput<Input>
): {
	result: QueryResult<Data>;
	refetch: (args?: InternalQueryArgsWithInput<Input>) => void;
} {
	const { ssrCache, client, isWindowFocused, refetchMountedOperations, user } = useContext(wunderGraphContext);
	const isServer = typeof window === 'undefined';
	const ssrEnabled = args?.disableSSR !== true && args?.lazy !== true;
	const cacheKey = client.cacheKey(query, args);
	if (isServer) {
		if (query.requiresAuthentication && user === null) {
			ssrCache[cacheKey] = {
				status: 'requires_authentication',
			};
			return {
				result: ssrCache[cacheKey] as QueryResult<Data>,
				refetch: () => {},
			};
		}
		if (ssrEnabled) {
			if (ssrCache[cacheKey]) {
				return {
					result: ssrCache[cacheKey] as QueryResult<Data>,
					refetch: () => Promise.resolve(ssrCache[cacheKey] as QueryResult<Data>),
				};
			}
			const promise = client.query(query, args);
			ssrCache[cacheKey] = promise;
			throw promise;
		} else {
			ssrCache[cacheKey] = {
				status: 'none',
			};
			return {
				result: ssrCache[cacheKey] as QueryResult<Data>,
				refetch: () => ({}),
			};
		}
	}
	const [invalidate, setInvalidate] = useState<number>(0);
	const [debounce, setDebounce] = useState<number>(0);
	const [statefulArgs, setStatefulArgs] = useState<InternalQueryArgsWithInput<Input> | undefined>(args);
	const [lazy] = useState(args?.lazy === true);
	const [lastCacheKey, setLastCacheKey] = useState<string>('');
	const [refetchOnWindowFocus] = useState(args?.refetchOnWindowFocus === true);
	const [queryResult, setQueryResult] = useState<QueryResult<Data> | undefined>(
		(ssrCache[cacheKey] as QueryResult<Data>) || { status: 'none' }
	);
	useEffect(() => {
		if (debounce === 0) {
			return;
		}
		const cancel = setTimeout(() => {
			setInvalidate((prev) => prev + 1);
		}, args?.debounceMillis || 0);
		return () => clearTimeout(cancel);
	}, [debounce]);
	useEffect(() => {
		if (lastCacheKey === '') {
			setLastCacheKey(cacheKey);
			return;
		}
		if (lastCacheKey === cacheKey) {
			return;
		}
		setLastCacheKey(cacheKey);
		setStatefulArgs(args);
		if (args?.debounceMillis !== undefined) {
			setDebounce((prev) => prev + 1);
			return;
		}
		setInvalidate(invalidate + 1);
	}, [cacheKey]);
	useEffect(() => {
		if (queryResult?.status === 'lazy' || queryResult?.status === 'none') {
			return;
		}
		setInvalidate((prev) => prev + 1);
	}, [refetchMountedOperations]);
	useEffect(() => {
		if (query.requiresAuthentication && user === null) {
			setQueryResult({
				status: 'requires_authentication',
			});
			return;
		}
		if (lazy && invalidate === 0) {
			setQueryResult({
				status: 'lazy',
			});
			return;
		}
		const abort = new AbortController();
		if (queryResult?.status === 'ok') {
			setQueryResult({ ...queryResult, refetching: true });
		} else {
			setQueryResult({ status: 'loading' });
		}
		(async () => {
			const result = await client.query(query, {
				...statefulArgs,
				abortSignal: abort.signal,
			});
			setQueryResult(result as QueryResult<Data>);
		})();
		return () => {
			abort.abort();
			setQueryResult({ status: 'cancelled' });
		};
	}, [invalidate, user]);
	useEffect(() => {
		if (!refetchOnWindowFocus) {
			return;
		}
		if (isWindowFocused !== 'focused') {
			return;
		}
		setInvalidate((prev) => prev + 1);
	}, [refetchOnWindowFocus, isWindowFocused]);
	const refetch = useCallback((args?: InternalQueryArgsWithInput<Input>) => {
		if (args !== undefined) {
			setStatefulArgs(args);
		}
		setInvalidate((prev) => prev + 1);
	}, []);
	return {
		result: queryResult as QueryResult<Data>,
		refetch,
	};
}

function useSubscriptionContextWrapper<Input, Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	subscription: SubscriptionProps,
	args?: InternalSubscriptionArgsWithInput<Input>
): {
	result: SubscriptionResult<Data>;
} {
	const { ssrCache, client, isWindowFocused, refetchMountedOperations, user } = useContext(wunderGraphContext);
	const isServer = typeof window === 'undefined';
	const ssrEnabled = args?.disableSSR !== true;
	const cacheKey = client.cacheKey(subscription, args);
	if (isServer) {
		if (subscription.requiresAuthentication && user === null) {
			ssrCache[cacheKey] = {
				status: 'requires_authentication',
			};
			return {
				result: ssrCache[cacheKey] as SubscriptionResult<Data>,
			};
		}
		if (ssrEnabled) {
			if (ssrCache[cacheKey]) {
				return {
					result: ssrCache[cacheKey] as SubscriptionResult<Data>,
				};
			}
			const promise = client.query(subscription, { ...args, subscribeOnce: true });
			ssrCache[cacheKey] = promise;
			throw promise;
		} else {
			ssrCache[cacheKey] = {
				status: 'none',
			};
			return {
				result: ssrCache[cacheKey] as SubscriptionResult<Data>,
			};
		}
	}
	const [invalidate, setInvalidate] = useState<number>(0);
	const [subscriptionResult, setSubscriptionResult] = useState<SubscriptionResult<Data> | undefined>(
		(ssrCache[cacheKey] as SubscriptionResult<Data>) || { status: 'none' }
	);
	const stopOnWindowBlur = args?.stopOnWindowBlur === true;
	const stop = !stopOnWindowBlur || isWindowFocused === 'focused' ? false : true;
	useEffect(() => {
		if (subscription.requiresAuthentication && user === null) {
			setSubscriptionResult({
				status: 'requires_authentication',
			});
			return;
		}
		if (stop) {
			if (subscriptionResult?.status === 'ok') {
				setSubscriptionResult({ ...subscriptionResult, streamState: 'stopped' });
			} else {
				setSubscriptionResult({ status: 'none' });
			}
			return;
		}
		if (subscriptionResult?.status === 'ok') {
			setSubscriptionResult({ ...subscriptionResult, streamState: 'restarting' });
		} else {
			setSubscriptionResult({ status: 'loading' });
		}
		const abort = new AbortController();
		client.subscribe(
			subscription,
			(response: SubscriptionResult<Data>) => {
				setSubscriptionResult(response as any);
			},
			{
				...args,
				abortSignal: abort.signal,
			}
		);
		return () => {
			abort.abort();
		};
	}, [stop, refetchMountedOperations, invalidate, user]);
	useEffect(() => {
		if (args?.debounceMillis === undefined) {
			setInvalidate((prev) => prev + 1);
			return;
		}
		const cancel = setTimeout(() => {
			setInvalidate((prev) => prev + 1);
		}, args.debounceMillis);
		return () => {
			clearTimeout(cancel);
		};
	}, [cacheKey]);
	return {
		result: subscriptionResult as SubscriptionResult<Data>,
	};
}

function useMutationContextWrapper<Role, Input = never, Data = never>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	mutation: MutationProps
): {
	result: MutationResult<Data>;
	mutate: (args?: InternalMutationArgsWithInput<Input>) => Promise<MutationResult<Data>>;
} {
	const { client, setRefetchMountedOperations, user } = useContext(wunderGraphContext);
	const [result, setResult] = useState<MutationResult<Data>>(
		mutation.requiresAuthentication && user === null ? { status: 'requires_authentication' } : { status: 'none' }
	);
	const mutate = useCallback(
		async (args?: InternalMutationArgsWithInput<Input>): Promise<MutationResult<Data>> => {
			if (mutation.requiresAuthentication && user === null) {
				return { status: 'requires_authentication' };
			}
			setResult({ status: 'loading' });
			const result = await client.mutate(mutation, args);
			setResult(result as any);
			if (result.status === 'ok' && args?.refetchMountedOperationsOnSuccess === true) {
				setRefetchMountedOperations((prev) => prev + 1);
			}
			return result as any;
		},
		[user]
	);
	useEffect(() => {
		if (!mutation.requiresAuthentication) {
			return;
		}
		if (user === null) {
			if (result.status !== 'requires_authentication') {
				setResult({ status: 'requires_authentication' });
			}
			return;
		}
		if (result.status !== 'none') {
			setResult({ status: 'none' });
		}
	}, [user]);
	return {
		result,
		mutate,
	};
}

function useWunderGraph<Role, AuthProviders extends string = '', S3Providers extends string = ''>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>
) {
	return function () {
		const { user, client, setUser } = useContext(wunderGraphContext);
		const login = useCallback(
			(provider: AuthProviders, redirectUri?: string) => {
				client.login(provider, redirectUri);
			},
			[client]
		);
		const logout = useCallback(
			async (options?: LogoutOptions) => {
				const success = await client.logout(options);
				if (success) {
					setUser(null);
				}
				return success;
			},
			[client]
		);
		const fetchUser = useCallback(async () => {
			const user = await client.fetchUser();
			setUser(user);
			return user;
		}, [client]);
		const uploadFiles = useCallback(
			async (config: UploadConfig<S3Providers>) => {
				return client.uploadFiles(config);
			},
			[client]
		);
		return {
			user,
			logout,
			login,
			fetchUser,
			uploadFiles,
		};
	};
}

function useQueryWithInput<Input, Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	query: QueryProps
) {
	return (args: QueryArgsWithInput<Input>) =>
		useQueryContextWrapper(wunderGraphContext, query, args) as {
			result: QueryResult<Data>;
			refetch: (args: QueryArgsWithInput<Input>) => void;
		};
}

function useQueryWithoutInput<Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	query: QueryProps
) {
	return (args?: QueryArgs) =>
		useQueryContextWrapper(wunderGraphContext, query, args as QueryArgsWithInput<never>) as {
			result: QueryResult<Data>;
			refetch: (args?: QueryArgs) => void;
		};
}

function useMutationWithInput<Input, Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	mutation: MutationProps
) {
	return useMutationContextWrapper<Role, Input, Data>(wunderGraphContext, mutation) as {
		result: MutationResult<Data>;
		mutate: (args: MutationArgsWithInput<Input>) => Promise<MutationResult<Data>>;
	};
}

function useMutationWithoutInput<Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	mutation: MutationProps
) {
	return useMutationContextWrapper<Role, never, Data>(wunderGraphContext, mutation) as {
		result: MutationResult<Data>;
		mutate: () => Promise<MutationResult<Data>>;
	};
}

function useSubscriptionWithInput<Input, Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	subscription: SubscriptionProps
) {
	return (args: SubscriptionArgsWithInput<Input>) =>
		useSubscriptionContextWrapper(wunderGraphContext, subscription, args) as {
			result: SubscriptionResult<Data>;
		};
}

function useSubscriptionWithoutInput<Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	subscription: SubscriptionProps
) {
	return (args?: SubscriptionArgs) =>
		useSubscriptionContextWrapper(
			wunderGraphContext,
			subscription,
			args as InternalSubscriptionArgsWithInput<never>
		) as {
			result: SubscriptionResult<Data>;
		};
}

export const hooks = {
	useWunderGraph,
	useQueryWithoutInput,
	useQueryWithInput,
	useMutationWithInput,
	useMutationWithoutInput,
	useSubscriptionWithInput,
	useSubscriptionWithoutInput,
	withWunderGraphContextWrapper,
};
