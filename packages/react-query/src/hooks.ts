import { useEffect, useRef, useState } from 'react';
import {
	useQuery as useTanstackQuery,
	useMutation as useTanstackMutation,
	useQueryClient,
	QueryFunctionContext,
} from '@tanstack/react-query';

import { OperationsDefinition, LogoutOptions, Client } from '@wundergraph/sdk/client';
import { serialize } from '@wundergraph/sdk/internal';
import {
	QueryFetcher,
	MutationFetcher,
	SubscribeToOptions,
	UseSubscribeToProps,
	UseQueryHook,
	UseMutationHook,
	UseSubscriptionHook,
	UseUploadHook,
	UseUserHook,
	QueryKey,
} from './types';

export const userQueryKey = 'wg_user';

export const createHooks = <Operations extends OperationsDefinition>(client: Client) => {
	const queryFetcher: QueryFetcher<Operations> = async (query) => {
		const result = await client.query(query);

		if (result.error) {
			throw result.error;
		}

		return result.data;
	};

	const mutationFetcher: MutationFetcher<Operations> = async (mutation) => {
		const result = await client.mutate(mutation);

		if (result.error) {
			throw result.error;
		}

		return result.data;
	};

	const queryKey: QueryKey<Operations> = ({ operationName, input }) => {
		return [operationName, input];
	};

	/**
	 * Execute a WunderGraph query.
	 *
	 * @usage
	 * ```ts
	 * const { data, error, isLoading } = useQuery({
	 *   operationName: 'Weather',
	 * })
	 * ```
	 *
	 * All queries support liveQuery by default, enabling this will set up a realtime subscription.
	 * ```ts
	 * const { data, error, isLoading, isSubscribed } = useQuery({
	 *   operationName: 'Weather',
	 *   liveQuery: true,
	 * })
	 * ```
	 */
	const useQuery: UseQueryHook<Operations> = (options) => {
		const { operationName, liveQuery, input, enabled, refetchOnWindowFocus, ...queryOptions } = options;
		const queryHash = serialize([operationName, input]);

		const result = useTanstackQuery({
			queryKey: queryKey({ operationName, input }),
			queryFn: ({ signal }: QueryFunctionContext) => queryFetcher({ operationName, input, abortSignal: signal }),
			...queryOptions,
			enabled: liveQuery ? false : enabled,
			refetchOnWindowFocus: liveQuery ? false : refetchOnWindowFocus,
		});

		const { isSubscribed } = useSubscribeTo({
			queryHash,
			operationName,
			input,
			liveQuery,
			enabled: options.enabled !== false && liveQuery,
			onSuccess: options.onSuccess,
			onError: options.onError,
		});

		if (liveQuery) {
			return {
				...result,
				isSubscribed,
			};
		}

		return result;
	};

	/**
	 * Execute a WunderGraph mutation.
	 *
	 * @usage
	 * ```ts
	 * const { mutate, data, error, isLoading } = useMutation({
	 *   operationName: 'SetName'
	 * })
	 *
	 * mutate({
	 *   name: 'John Doe'
	 * })
	 * ```
	 */
	const useMutation: UseMutationHook<Operations> = (options) => {
		const { operationName, ...mutationOptions } = options;

		return useTanstackMutation({
			mutationKey: [operationName],
			mutationFn: (input) => mutationFetcher({ operationName, input }),
			...mutationOptions,
		});
	};

	const useAuth = () => {
		const queryClient = useQueryClient();

		return {
			login: (authProviderID: Operations['authProvider'], redirectURI?: string | undefined) =>
				client.login(authProviderID, redirectURI),
			logout: async (options?: LogoutOptions | undefined) => {
				const result = await client.logout(options);
				// reset user in the cache and don't trigger a refetch
				queryClient.setQueryData([userQueryKey], null);
				return result;
			},
		};
	};

	/**
	 * Return the logged in user.
	 *
	 * @usage
	 * ```ts
	 * const { user, error, isLoading } = useUser()
	 * ```
	 */
	const useUser: UseUserHook<Operations> = (options) => {
		const { revalidate, ...queryOptions } = options || {};
		return useTanstackQuery(
			[userQueryKey],
			({ signal }) =>
				client.fetchUser({
					revalidate,
					abortSignal: signal,
				}),
			queryOptions
		);
	};

	/**
	 * Upload a file to S3 compatible storage.
	 *
	 * @usage
	 * ```ts
	 * const { upload, data, error } = useFileUpload()
	 *
	 * const uploadFile = (file: File) => {
	 *  upload(file)
	 * }
	 * ```
	 */
	const useFileUpload: UseUploadHook<Operations> = (options) => {
		const { mutate, mutateAsync, ...mutation } = useTanstackMutation(
			['uploadFiles'],
			async (input) => {
				const resp = await client.uploadFiles(input);
				return resp.fileKeys;
			},
			options
		) as any;

		return {
			upload: mutate,
			uploadAsync: mutateAsync,
			...mutation,
		};
	};

	// Set up a subscription that can be aborted.
	const subscribeTo = (options: SubscribeToOptions) => {
		const abort = new AbortController();

		const { onSuccess, onError, onResult, onAbort, ...subscription } = options;

		subscription.abortSignal = abort.signal;

		client.subscribe(subscription, onResult).catch(onError);

		return () => {
			onAbort?.();
			abort.abort();
		};
	};

	// Helper hook used in useQuery and useSubscription
	const useSubscribeTo = (props: UseSubscribeToProps) => {
		const client = useQueryClient();
		const { queryHash, operationName, input, enabled, liveQuery, subscribeOnce, resetOnMount, onSuccess, onError } =
			props;

		const startedAtRef = useRef<number | null>(null);
		const onSuccessRef = useRef(onSuccess);
		const onErrorRef = useRef(onError);

		const [state, setState] = useState({
			isLoading: false,
			isSubscribed: false,
		});

		useEffect(() => {
			if (!startedAtRef.current && resetOnMount) {
				client.removeQueries([operationName, input]);
			}
		}, []);

		useEffect(() => {
			if (enabled) {
				setState({ isLoading: true, isSubscribed: false });
			}
		}, [enabled]);

		useEffect(() => {
			let unsubscribe: ReturnType<typeof subscribeTo>;

			if (enabled) {
				unsubscribe = subscribeTo({
					operationName,
					input,
					liveQuery,
					subscribeOnce,
					onError(error) {
						setState({ isLoading: false, isSubscribed: false });
						onErrorRef.current?.(error);
						startedAtRef.current = null;
					},
					onResult(result) {
						if (!startedAtRef.current) {
							setState({ isLoading: false, isSubscribed: true });
							onSuccessRef.current?.(result);
							startedAtRef.current = new Date().getTime();
						}

						// Promise is not handled because we are not interested in the result
						// Errors are handled by React Query internally
						client.setQueryData([operationName, input], () => {
							if (result.error) {
								throw result.error;
							}

							return result.data;
						});
					},
					onAbort() {
						setState({ isLoading: false, isSubscribed: false });
						startedAtRef.current = null;
					},
				});
			}

			return () => {
				unsubscribe?.();
			};
		}, [queryHash, enabled, liveQuery, subscribeOnce]);

		return state;
	};

	/**
	 * useSubscription
	 *
	 * Subscribe to subscription operations.
	 *
	 * @usage
	 * ```ts
	 * const { data, error, isLoading, isSubscribed } = useSubscription({
	 *   operationName: 'Countdown',
	 * })
	 */
	const useSubscription: UseSubscriptionHook<Operations> = (options) => {
		const { enabled = true, operationName, input, subscribeOnce, onSuccess, onError } = options;
		const queryHash = serialize([operationName, input]);

		const subscription = useTanstackQuery<any, any, any, any>({
			queryKey: [operationName, input],
			enabled: false, // we update the cache async
		});

		const { isSubscribed } = useSubscribeTo({
			queryHash,
			operationName,
			input,
			subscribeOnce,
			enabled,
			onSuccess,
			onError,
		});

		return {
			...subscription,
			isSubscribed,
		};
	};

	return {
		useAuth,
		useFileUpload,
		useUser,
		useMutation,
		useQuery,
		useSubscription,
		queryKey,
	};
};
