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

import { InternalSubscriptionArgs, WunderGraphClient } from '@wundergraph/sdk/client';

import type {
	ClientConfig,
	InternalMutationArgsWithInput,
	InternalQueryArgsWithInput,
	InternalSubscriptionArgsWithInput,
	MutationArgsWithInput,
	MutationProps,
	MutationResult,
	QueryArgs,
	QueryArgsWithInput,
	QueryProps,
	QueryResult,
	SubscriptionArgs,
	SubscriptionArgsWithInput,
	SubscriptionProps,
	SubscriptionResult,
	User,
	UploadConfig,
} from '@wundergraph/sdk/client';

export type Headers = { [key: string]: string };

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export interface LogoutOptions {
	logout_openid_connect_provider?: boolean;
}

export interface WunderGraphContextProperties<Role> {
	ssrCache: { [key: string]: Promise<any> | {} };
	clientConfig: ClientConfig & { authenticationEnabled?: boolean };
	client: WunderGraphClient<Role>;
	user: User<Role> | null;
	setUser: Dispatch<SetStateAction<User<Role> | null>>;
	isWindowFocused: 'pristine' | 'focused' | 'blurred';
	setIsWindowFocused: Dispatch<SetStateAction<'pristine' | 'focused' | 'blurred'>>;
	refetchMountedOperations: number;
	setRefetchMountedOperations: Dispatch<SetStateAction<number>>;
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
			defaultContextProperties.client = new WunderGraphClient(baseOptions);
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

interface ContextWrapperOptions {
	requiresAuthentication: boolean;
}

interface UseQueryProps extends QueryProps {
	requiresAuthentication?: boolean;
}

function useQueryContextWrapper<Input, Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	query: UseQueryProps,
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
		if (query?.requiresAuthentication && user === null) {
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
		if (query?.requiresAuthentication && user === null) {
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

interface UseSubscriptionProps extends SubscriptionProps {
	requiresAuthentication?: boolean;
}

function useSubscriptionContextWrapper<Input, Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	subscription: UseSubscriptionProps,
	args?: InternalSubscriptionArgsWithInput<Input>
): {
	result: SubscriptionResult<Data>;
} {
	const { ssrCache, client, isWindowFocused, refetchMountedOperations, user } = useContext(wunderGraphContext);
	const isServer = typeof window === 'undefined';
	const ssrEnabled = args?.disableSSR !== true;
	const cacheKey = client.cacheKey(subscription, args);
	if (isServer) {
		if (subscription?.requiresAuthentication && user === null) {
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
		if (subscription?.requiresAuthentication && user === null) {
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

interface UseMutationProps extends MutationProps {
	requiresAuthentication?: boolean;
}

function useMutationContextWrapper<Role, Input = never, Data = never>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	mutation: UseMutationProps
): {
	result: MutationResult<Data>;
	mutate: (args?: InternalMutationArgsWithInput<Input>) => Promise<MutationResult<Data>>;
} {
	const { client, setRefetchMountedOperations, user } = useContext(wunderGraphContext);
	const [result, setResult] = useState<MutationResult<Data>>(
		mutation?.requiresAuthentication && user === null ? { status: 'requires_authentication' } : { status: 'none' }
	);
	const mutate = useCallback(
		async (args?: InternalMutationArgsWithInput<Input>): Promise<MutationResult<Data>> => {
			if (mutation?.requiresAuthentication && user === null) {
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
		if (!mutation?.requiresAuthentication) {
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
	query: UseQueryProps
) {
	return (args: QueryArgsWithInput<Input>) =>
		useQueryContextWrapper(wunderGraphContext, query, args) as {
			result: QueryResult<Data>;
			refetch: (args: QueryArgsWithInput<Input>) => void;
		};
}

function useQueryWithoutInput<Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	query: UseQueryProps
) {
	return (args?: QueryArgs) =>
		useQueryContextWrapper(wunderGraphContext, query, args as QueryArgsWithInput<never>) as {
			result: QueryResult<Data>;
			refetch: (args?: QueryArgs) => void;
		};
}

function useMutationWithInput<Input, Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	mutation: UseMutationProps
) {
	return useMutationContextWrapper<Role, Input, Data>(wunderGraphContext, mutation) as {
		result: MutationResult<Data>;
		mutate: (args: MutationArgsWithInput<Input>) => Promise<MutationResult<Data>>;
	};
}

function useMutationWithoutInput<Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	mutation: UseMutationProps
) {
	return useMutationContextWrapper<Role, never, Data>(wunderGraphContext, mutation) as {
		result: MutationResult<Data>;
		mutate: () => Promise<MutationResult<Data>>;
	};
}

function useSubscriptionWithInput<Input, Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	subscription: UseSubscriptionProps
) {
	return (args: InternalSubscriptionArgsWithInput<Input>) =>
		useSubscriptionContextWrapper(wunderGraphContext, subscription, args) as {
			result: SubscriptionResult<Data>;
		};
}

function useSubscriptionWithoutInput<Data, Role>(
	wunderGraphContext: Context<WunderGraphContextProperties<Role>>,
	subscription: UseSubscriptionProps
) {
	return (args?: InternalSubscriptionArgs) =>
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
