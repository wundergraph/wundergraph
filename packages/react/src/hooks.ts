import { useCallback, useState, useEffect, Context } from 'react';

import type {
	InternalMutationArgsWithInput,
	InternalQueryArgsWithInput,
	InternalSubscriptionArgsWithInput,
	SubscriptionArgsWithInput,
	MutationArgsWithInput,
	MutationResult,
	QueryArgs,
	QueryArgsWithInput,
	QueryResult,
	SubscriptionResult,
	UploadConfig,
} from '@wundergraph/sdk/client';

import { useWunderGraphContext, WunderGraphContextProperties } from './provider';

export interface LogoutOptions {
	logout_openid_connect_provider?: boolean;
}

interface UseQueryProps {
	operationName: string;
}

export interface UseQueryOptions<Role> {
	context?: Context<WunderGraphContextProperties<Role> | undefined>;
	requiresAuthentication?: boolean;
}

export function useQuery<Input, Data, Role>(
	query: UseQueryProps,
	args?: QueryArgsWithInput<Input>,
	options?: UseQueryOptions<Role>
): {
	result: QueryResult<Data>;
	refetch: (args?: QueryArgsWithInput<Input>) => void;
} {
	const { ssrCache, client, isWindowFocused, refetchMountedOperations, user } = useWunderGraphContext<Role>(
		options?.context,
		{ name: 'useQuery' }
	);
	const isServer = typeof window === 'undefined';
	const ssrEnabled = args?.disableSSR !== true && args?.lazy !== true;
	const cacheKey = client.cacheKey({
		...query,
		...args,
	});

	if (isServer) {
		if (options?.requiresAuthentication && user === null) {
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
			const promise = client.query<Input, Data>({
				...query,
				...args,
			});
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
		if (options?.requiresAuthentication && user === null) {
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
			const result = await client.query<Input, Data>({
				...query,
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

interface UseSubscriptionProps {
	operationName: string;
}

interface UseSubscriptionArgs<Input> extends SubscriptionArgsWithInput<Input> {
	isLiveQuery: boolean;
}

interface UseSubscriptionOptions<Role> {
	context?: Context<WunderGraphContextProperties<Role> | undefined>;
	requiresAuthentication?: boolean;
}

export function useSubscription<Input, Data, Role>(
	subscription: UseSubscriptionProps,
	args?: UseSubscriptionArgs<Input>,
	options?: UseSubscriptionOptions<Role>
): {
	result: SubscriptionResult<Data>;
} {
	const { ssrCache, client, isWindowFocused, refetchMountedOperations, user } = useWunderGraphContext(
		options?.context,
		{ name: 'useSubscription' }
	);
	const isServer = typeof window === 'undefined';
	const ssrEnabled = args?.disableSSR !== true;
	const cacheKey = client.cacheKey({
		...subscription,
		...args,
	});
	if (isServer) {
		if (options?.requiresAuthentication && user === null) {
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
			const promise = client.query({ ...subscription, ...args, subscribeOnce: true });
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
		if (options?.requiresAuthentication && user === null) {
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
			{
				...subscription,
				...args,
				abortSignal: abort.signal,
			},
			(result: SubscriptionResult<Data>) => {
				setSubscriptionResult(result);
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

interface UseMutationProps {
	operationName: string;
}

interface UseMutationOptions<Role> {
	context?: Context<WunderGraphContextProperties<Role> | undefined>;
	requiresAuthentication?: boolean;
}

export function useMutation<Input, Data, Role>(
	mutation: UseMutationProps,
	options: UseMutationOptions<Role>
): {
	result: MutationResult<Data>;
	mutate: (args?: MutationArgsWithInput<Input>) => Promise<MutationResult<Data>>;
} {
	const { client, setRefetchMountedOperations, user } = useWunderGraphContext(options.context, {
		name: 'useMutation',
	});
	const [result, setResult] = useState<MutationResult<Data>>(
		options?.requiresAuthentication && user === null ? { status: 'requires_authentication' } : { status: 'none' }
	);
	const mutate = useCallback(
		async (args?: InternalMutationArgsWithInput<Input>): Promise<MutationResult<Data>> => {
			if (options?.requiresAuthentication && user === null) {
				return { status: 'requires_authentication' };
			}
			setResult({ status: 'loading' });
			const result = await client.mutate({ ...mutation, ...args });
			setResult(result as any);
			if (result.status === 'ok' && args?.refetchMountedOperationsOnSuccess === true) {
				setRefetchMountedOperations((prev) => prev + 1);
			}
			return result as any;
		},
		[user]
	);
	useEffect(() => {
		if (!options?.requiresAuthentication) {
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

export interface UseWunderGraphProps<Role> {
	context?: Context<WunderGraphContextProperties<Role> | undefined>;
}

export function useWunderGraph<Role, AuthProviders extends string = '', S3Providers extends string = ''>(
	props: UseWunderGraphProps<Role>
) {
	const { user, client, setUser } = useWunderGraphContext<Role>(props.context, { name: 'useWunderGraph' });
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
		try {
			const user = await client.fetchUser();
			setUser(user);
			return user;
		} catch {
			setUser(null);
			return null;
		}
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
}
