import {
	createQuery as createTanstackQuery,
	createMutation as createTanstackMutation,
	useQueryClient,
	QueryFunctionContext,
} from '@tanstack/solid-query';

import { OperationsDefinition, LogoutOptions, Client, UploadRequestOptions } from '@wundergraph/sdk/client';
import { serialize } from '@wundergraph/sdk/internal';
import { createEffect, mergeProps, onCleanup, splitProps } from 'solid-js';
import { createStore } from 'solid-js/store';
import {
	QueryFetcher,
	MutationFetcher,
	SubscribeToOptions,
	CreateSubscribeToProps,
	CreateQueryHook,
	CreateMutationHook,
	CreateSubscriptionHook,
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
	 * const weather = createQuery({
	 *   operationName: 'Weather',
	 * })
	 * ```
	 *
	 * All queries support liveQuery by default, enabling this will set up a realtime subscription.
	 * ```ts
	 * const weather = createQuery({
	 *   operationName: 'Weather',
	 *   liveQuery: true,
	 * })
	 * ```
	 */
	const createQuery: CreateQueryHook<Operations> = (options) => {
		const { operationName, liveQuery, input, enabled, refetchOnWindowFocus, ...queryOptions } = options;
		const queryHash = serialize([operationName, input]);

		const result = createTanstackQuery<any, any, any, any>({
			queryKey: () => queryKey({ operationName, input }),
			queryFn: ({ signal }: QueryFunctionContext) => queryFetcher({ operationName, input, abortSignal: signal }),
			...queryOptions,
			enabled: liveQuery ? false : enabled,
			refetchOnWindowFocus: liveQuery ? false : refetchOnWindowFocus,
		});

		const state = useSubscribeTo({
			queryHash,
			operationName,
			input,
			liveQuery,
			enabled: options.enabled !== false && liveQuery,
			onSuccess: options.onSuccess,
			onError: options.onError,
		});

		if (liveQuery) {
			return mergeProps(result, {
				get isSubscribed() {
					return state.isSubscribed;
				},
			});
		}

		return result;
	};

	/**
	 * Execute a WunderGraph mutation.
	 *
	 * @usage
	 * ```ts
	 * const mutation = createMutation({
	 *   operationName: 'SetName'
	 * })
	 *
	 * mutation.mutate({
	 *   name: 'John Doe'
	 * })
	 * ```
	 */
	const createMutation: CreateMutationHook<Operations> = (options) => {
		const { operationName, ...mutationOptions } = options;

		return createTanstackMutation({
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
	 * const user = useUser()
	 *
	 * user.data?.email
	 * ```
	 */
	const useUser: UseUserHook<Operations> = (options) => {
		const { revalidate, ...queryOptions } = options || {};
		return createTanstackQuery<any, any, any, any>(
			() => [userQueryKey],
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
	 * const uploader = useFileUpload()
	 *
	 * const uploadFile = (file: File) => {
	 *  uploader.upload(file)
	 * }
	 * ```
	 */
	const useFileUpload: UseUploadHook<Operations> = (options) => {
		const upload = createTanstackMutation({
			mutationKey: ['uploadFiles'],
			mutationFn: async (input: UploadRequestOptions) => {
				const resp = await client.uploadFiles(input);
				return resp.fileKeys;
			},
			...options,
		});

		const [mutateProps, props] = splitProps(upload, ['mutate', 'mutateAsync']);

		return mergeProps(props, {
			upload: mutateProps.mutate,
			uploadAsync: mutateProps.mutateAsync,
		});
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
	const useSubscribeTo = (props: CreateSubscribeToProps) => {
		const client = useQueryClient();
		const { operationName, input, enabled, liveQuery, subscribeOnce, resetOnMount, onSuccess, onError } = props;

		let startedAtRef: number | null = null;

		const [state, setState] = createStore({
			isLoading: false,
			isSubscribed: false,
			isError: false,
		});

		createEffect(() => {
			if (!startedAtRef && resetOnMount) {
				client.removeQueries([operationName, input]);
			}
		});

		createEffect(() => {
			if (enabled) {
				setState({ isLoading: true, isSubscribed: false, isError: false });
			}
		});

		createEffect(() => {
			let unsubscribe: ReturnType<typeof subscribeTo>;

			if (enabled) {
				unsubscribe = subscribeTo({
					operationName,
					input,
					liveQuery,
					subscribeOnce,
					onError(error) {
						setState({ isLoading: false, isSubscribed: false, isError: true });
						onError?.(error);
						startedAtRef = null;
					},
					onResult(result) {
						if (!startedAtRef) {
							setState({ isLoading: false, isSubscribed: true, isError: false });
							onSuccess?.(result);
							startedAtRef = new Date().getTime();
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
						setState({ isLoading: false, isSubscribed: false, isError: false });
						startedAtRef = null;
					},
				});
			}

			onCleanup(() => {
				unsubscribe?.();
			});
		});

		return state;
	};

	/**
	 * useSubscription
	 *
	 * Subscribe to subscription operations.
	 *
	 * @usage
	 * ```ts
	 * const subscription = useSubscription({
	 *   operationName: 'Countdown',
	 * })
	 */
	const createSubscription: CreateSubscriptionHook<Operations> = (options) => {
		const { enabled = true, operationName, input, subscribeOnce, onSuccess, onError } = options;
		const queryHash = serialize([operationName, input]);

		const subscription = createTanstackQuery<any, any, any, any>({
			queryKey: () => [operationName, input],
			enabled: false, // we update the cache async
		});

		const state = useSubscribeTo({
			queryHash,
			operationName,
			input,
			subscribeOnce,
			enabled,
			onSuccess,
			onError,
		});

		return mergeProps(subscription, {
			isSubscribed: state.isSubscribed,
		});
	};

	return {
		useAuth,
		useFileUpload,
		useUser,
		createQuery,
		createMutation,
		createSubscription,
		queryKey,
	};
};
