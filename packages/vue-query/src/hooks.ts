import { ref, unref, onMounted, onUnmounted, reactive } from 'vue';

import {
	useQuery as useTanstackQuery,
	useMutation as useTanstackMutation,
	useQueryClient,
	QueryFunctionContext,
} from '@tanstack/vue-query';

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

		const { isSubscribed } = useSubscribeTo(
			reactive({
				queryHash,
				operationName,
				input,
				liveQuery,
				enabled: options.enabled !== false && liveQuery,
				onSuccess: unref(options.onSuccess),
				onError: unref(options.onError),
			})
		);
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
	//@ts-expect-error We have to ignore this because the vue-query types are not correct.
	const useMutation: UseMutationHook<Operations> = (options) => {
		const { operationName, variables, ...mutationOptions } = options;

		const result = useTanstackMutation(
			[operationName],
			(input) => mutationFetcher({ operationName, input }),
			// rome-ignore lint/suspicious/noExplicitAny: Bug with the vue query type MaybeRefDeep
			{ ...mutationOptions, variables: variables as any }
		);
		return result;
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
	//@ts-expect-error We have to ignore this because the vue-query types are not correct.
	const useFileUpload: UseUploadHook<Operations> = (options) => {
		const { mutate, mutateAsync, ...mutation } = useTanstackMutation(
			['uploadFiles'],
			async (input) => {
				const resp = await client.uploadFiles(input);
				return resp.fileKeys;
			},
			options
		);

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
			unref(props);

		const startedAt = ref<number | null>(null);
		// const onSuccessRef = ref(onSuccess);
		// const onErrorRef = ref(onError);
		const isLoading = ref(false);
		const isSubscribed = ref(false);

		let unsubscribe: ReturnType<typeof subscribeTo> = () => undefined;

		onMounted(() => {
			console.log('Mounted Subscriber', queryHash);
			if (!startedAt.value && resetOnMount) {
				client.removeQueries([operationName, input]);
			}

			if (enabled) {
				console.log('Enabled !');
				isLoading.value = true;
				isSubscribed.value = false;

				unsubscribe = subscribeTo({
					operationName,
					input,
					liveQuery: unref(liveQuery),
					subscribeOnce,
					onError(error) {
						console.log('have error', error);
						isLoading.value = false;
						isSubscribed.value = false;
						onError?.(error);
						startedAt.value = null;
					},
					onResult(result) {
						console.log('Have result', result);
						if (!startedAt.value) {
							isLoading.value = false;
							isSubscribed.value = true;
							console.log('triggering callback');
							onSuccess?.(result);
							startedAt.value = new Date().getTime();
						}

						// Promise is not handled because we are not interested in the result
						// Errors are handled by Vue Query internally
						client.setQueryData([operationName, input], () => {
							if (result.error) throw result.error;
							return result.data;
						});
					},
					onAbort() {
						isLoading.value = false;
						isSubscribed.value = false;
						startedAt.value = null;
					},
				});
			}
		});

		onUnmounted(() => {
			unsubscribe();
		});

		return { isLoading, isSubscribed };
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
	//@ts-expect-error We have to ignore this because the vue-query types are not correct.
	const useSubscription: UseSubscriptionHook<Operations> = (options) => {
		const { enabled = true, operationName, input, subscribeOnce, onSuccess, onError } = options;
		const queryHash = serialize([operationName, input]);

		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		const subscription = useTanstackQuery<any, any, any, any>({
			queryKey: [operationName, input],
			enabled: false, // we update the cache async
		});

		const { isSubscribed } = useSubscribeTo(
			reactive({
				queryHash,
				operationName,
				input,
				subscribeOnce,
				enabled,
				onSuccess,
				onError,
			})
		);

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
