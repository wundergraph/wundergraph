import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';

import { OperationsDefinition, LogoutOptions, Client, ResponseError } from '@wundergraph/sdk/client';
import { serialize } from '@wundergraph/sdk/internal';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	QueryFetcher,
	MutationFetcher,
	SubscribeToOptions,
	UseSubscribeToProps,
	UseQueryHook,
	UseUserOptions,
	UseMutationHook,
	UseSubscriptionHook,
	UseUploadHook,
	UseUserHook,
} from './types';

export const userSWRKey = 'wg_user';

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

	/**
	 * Execute a WunderGraph query.
	 *
	 * @usage
	 * ```ts
	 * const { data, error, isValidating } = useQuery({
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
		const { operationName, liveQuery, enabled = true, input, ...swrConfig } = options;
		const { onSuccess: onSuccessProp, onError: onErrorProp } = swrConfig;
		const key = liveQuery ? { operationName, input, liveQuery } : { operationName, input };
		const _key = serialize(key);

		const response = useSWR(enabled ? key : null, !liveQuery ? queryFetcher : null, swrConfig);

		const onSuccess = useCallback(
			(response: any) => {
				onSuccessProp?.(response, _key, swrConfig as any);
			},
			[onSuccessProp, _key]
		);

		const onError = useCallback(
			(err: ResponseError) => {
				onErrorProp?.(err, _key, swrConfig as any);
			},
			[onErrorProp, _key]
		);

		const subscription = useSubscribeTo({
			mutationKey: _key,
			operationName,
			input,
			liveQuery,
			enabled: enabled && liveQuery,
			onSuccess,
			onError,
		});

		if (liveQuery) {
			return {
				...response,
				...subscription,
			};
		}

		return response;
	};

	/**
	 * Execute a WunderGraph mutation.
	 *
	 * @usage
	 * ```ts
	 * const { trigger, data, error, isLoading } = useMutation({
	 *   operationName: 'SetName'
	 * })
	 *
	 * trigger({
	 *   name: 'John Doe'
	 * })
	 * ```
	 */
	const useMutation: UseMutationHook<Operations> = (options) => {
		const { operationName, ...config } = options;

		return useSWRMutation(
			operationName,
			((key: string, { arg: input }: { arg?: object }) => {
				return mutationFetcher({
					operationName,
					input,
				});
			}) as any,
			config
		);
	};

	const useAuth = () => {
		const { mutate } = useSWRConfig();

		return {
			login: (authProviderID: Operations['authProvider'], redirectURI?: string | undefined) =>
				client.login(authProviderID, redirectURI),
			logout: async (options?: LogoutOptions | undefined) => {
				const result = await client.logout(options);
				// reset user in the cache and don't trigger a refetch
				mutate(userSWRKey, null, { revalidate: false, populateCache: true });
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
		const { enabled = true, revalidate, ...swrOptions } = options || {};
		return useSWR<Operations['user'], ResponseError>(
			enabled ? userSWRKey : null,
			() => client.fetchUser(options),
			swrOptions
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
	const useFileUpload: UseUploadHook<Operations> = (config) => {
		const { trigger, ...mutation } = useSWRMutation(
			'uploadFiles',
			async (key, { arg }) => {
				const resp = await client.uploadFiles(arg);
				return resp.fileKeys;
			},
			config
		) as any;

		return {
			upload: trigger,
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
		const { mutate } = useSWRConfig();
		const { mutationKey, operationName, input, enabled, liveQuery, subscribeOnce, resetOnMount, onSuccess, onError } =
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
				mutate(mutationKey, null);
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
						// Errors are handled by SWR internally
						mutate(mutationKey, () => {
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
		}, [mutationKey, enabled, liveQuery, subscribeOnce]);

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
		const {
			enabled = true,
			operationName,
			input,
			subscribeOnce,
			resetOnMount,
			onSuccess: onSuccessProp,
			onError: onErrorProp,
		} = options;
		const key = { operationName, input, subscription: true };
		const _key = serialize(key);

		const { data, error } = useSWR(enabled ? key : null, null);

		const onSuccess = useCallback(
			(response: object) => {
				onSuccessProp?.(response, _key, options);
			},
			[onSuccessProp, _key]
		);

		const onError = useCallback(
			(error: ResponseError) => {
				onErrorProp?.(error, _key, options);
			},
			[onErrorProp, _key]
		);

		const { isLoading, isSubscribed } = useSubscribeTo({
			mutationKey: _key,
			enabled,
			operationName,
			input,
			subscribeOnce,
			resetOnMount,
			onSuccess,
			onError,
		});

		return {
			isLoading,
			isSubscribed,
			data,
			error,
		};
	};

	return {
		useAuth,
		useFileUpload,
		useUser,
		useMutation,
		useQuery,
		useSubscription,
	};
};
