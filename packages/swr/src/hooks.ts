import useSWR, { mutate, SWRConfiguration, SWRResponse, MutatorOptions } from 'swr';
import {
	OperationRequestOptions,
	SubscriptionRequestOptions,
	FetchUserRequestOptions,
	GraphQLResponseError,
	ClientResponse,
	OperationsDefinition,
	UploadRequestOptions,
	LogoutOptions,
	Client,
} from '@wundergraph/sdk/client';
import { serialize } from '@wundergraph/sdk/internal';
import { useEffect, useState } from 'react';
import { Error } from '@wundergraph/sdk';

export type UseQueryOptions<OperationName, Input, LiveQuery> = SWRConfiguration & {
	operationName: OperationName;
	liveQuery?: LiveQuery;
	enabled?: boolean;
	input?: Input;
};

export type UseSubscriptionOptions<OperationName, Input> = SWRConfiguration & {
	operationName: OperationName;
	subscribeOnce?: boolean;
	enabled?: boolean;
	input?: Input;
};

export type UseMutationOptions<OperationName> = SWRConfiguration & {
	operationName: OperationName;
};

export type MutateOptions<Input, Data> = MutatorOptions<Data> & { input?: Input };

export const userSWRKey = 'wg_user';

export const createHooks = <Operations extends OperationsDefinition>(client: Client) => {
	const queryFetcher = async <
		OperationName extends Extract<keyof Operations['queries'], string>,
		Data extends Operations['queries'][OperationName]['data'] = Operations['queries'][OperationName]['data'],
		RequestOptions extends OperationRequestOptions<
			Extract<keyof Operations['queries'], string>,
			Operations['queries'][OperationName]['input']
		> = OperationRequestOptions<
			Extract<keyof Operations['queries'], string>,
			Operations['queries'][OperationName]['input']
		>
	>(
		query: RequestOptions
	) => {
		const result = await client.query<RequestOptions, Data>(query);

		if (result.error) {
			throw result.error;
		}

		return result.data;
	};

	const mutationFetcher = async <
		OperationName extends Extract<keyof Operations['mutations'], string>,
		Data extends Operations['mutations'][OperationName]['data'] = Operations['mutations'][OperationName]['data'],
		RequestOptions extends OperationRequestOptions<
			Extract<keyof Operations['mutations'], string>,
			Operations['mutations'][OperationName]['input']
		> = OperationRequestOptions<
			Extract<keyof Operations['mutations'], string>,
			Operations['mutations'][OperationName]['input']
		>
	>(
		mutation: RequestOptions
	) => {
		const result = await client.mutate<RequestOptions, Data>(mutation);

		if (result.error) {
			throw result.error;
		}

		return result.data;
	};

	const useQuery = <
		OperationName extends Extract<keyof Operations['queries'], string>,
		Input extends Operations['queries'][OperationName]['input'] = Operations['queries'][OperationName]['input'],
		Data extends Operations['queries'][OperationName]['data'] = Operations['queries'][OperationName]['data'],
		LiveQuery extends Operations['queries'][OperationName]['liveQuery'] = Operations['queries'][OperationName]['liveQuery']
	>(
		options: UseQueryOptions<OperationName, Input, LiveQuery>
	) => {
		const { operationName, liveQuery, enabled = true, input, ...swrConfig } = options;
		const key = { operationName, input };
		const _key = serialize(key);
		const response = useSWR<Data | undefined, GraphQLResponseError>(
			enabled ? key : null,
			!liveQuery ? queryFetcher : null,
			swrConfig
		);

		useEffect(() => {
			let unsubscribe: () => void;
			if (liveQuery && enabled) {
				unsubscribe = subscribeTo({ operationName, input, liveQuery });
			}
			return () => {
				unsubscribe?.();
			};
		}, [liveQuery, enabled, _key]);

		return response;
	};

	const useMutation = <
		OperationName extends Extract<keyof Operations['mutations'], string>,
		Input extends Operations['mutations'][OperationName]['input'] = Operations['mutations'][OperationName]['input'],
		Data extends Operations['mutations'][OperationName]['data'] = Operations['mutations'][OperationName]['data']
	>(
		options: UseMutationOptions<OperationName>
	) => {
		const { operationName, ...config } = options;
		const response = useSWR<Data, GraphQLResponseError>(operationName, null, config);

		return {
			...response,
			async mutate(options?: MutateOptions<Input, Data>): Promise<Data | undefined> {
				return response.mutate(() => {
					return mutationFetcher({ operationName, input: options?.input });
				}, options);
			},
		};
	};

	const useAuth = () => {
		return {
			login: (authProviderID: Operations['authProvider'], redirectURI?: string | undefined) =>
				client.login(authProviderID, redirectURI),
			logout: async (options?: LogoutOptions | undefined) => {
				const result = await client.logout(options);
				// reset user in the cache and don't trigger a refetch
				mutate(userSWRKey, null, { revalidate: false });
				return result;
			},
		};
	};

	const useUser = (options?: FetchUserRequestOptions & { enabled?: boolean }, swrOptions?: SWRConfiguration) => {
		const { enabled = true } = options || {};
		return useSWR<Operations['user'], GraphQLResponseError>(
			enabled ? userSWRKey : null,
			() => client.fetchUser(options),
			swrOptions
		);
	};

	const useFileUpload = () => {
		const [uploadResult, setUploadResult] = useState<{ data?: string[]; error?: Error }>(() => ({
			data: undefined,
			error: undefined,
		}));
		return {
			data: uploadResult,
			upload: async (options: UploadRequestOptions): Promise<string[] | undefined> => {
				try {
					const resp = await client.uploadFiles(options);
					setUploadResult({ data: resp.fileKeys, error: undefined });
					return resp.fileKeys;
				} catch (err: any) {
					setUploadResult({ data: undefined, error: err });
				}
			},
		};
	};

	/**
	 * This is will subscribe to an operation and mutate the SWR state on result.
	 *
	 * @usage
	 * ```ts
	 * const unsubscribe = subscribeTo({ operationName: 'hello', world: 'World' })
	 * ```
	 */
	const subscribeTo = (options: SubscriptionRequestOptions) => {
		const abort = new AbortController();

		options.abortSignal = abort.signal;

		client.subscribe(options, (result: ClientResponse) => {
			// Promise is not handled because we are not interested in the result
			// Errors are handled by SWR internally
			mutate({ operationName: options.operationName, input: options.input }, () => {
				if (result.error) {
					throw result.error;
				}
				return result.data;
			});
		});
		return () => {
			abort.abort();
		};
	};

	const useSubscription = <
		OperationName extends Extract<keyof Operations['subscriptions'], string>,
		Input extends Operations['subscriptions'][OperationName]['input'] = Operations['subscriptions'][OperationName]['input'],
		Data extends Operations['subscriptions'][OperationName]['data'] = Operations['subscriptions'][OperationName]['data']
	>(
		options: UseSubscriptionOptions<OperationName, Input>
	): SWRResponse<Data, GraphQLResponseError> => {
		const { enabled = true, operationName, input, subscribeOnce, ...swrConfig } = options;
		const key = { operationName, input };
		const _key = serialize(key);
		const response = useSWR(enabled ? key : null, null, swrConfig);

		useEffect(() => {
			let unsubscribe: () => void;
			if (enabled) {
				unsubscribe = subscribeTo({
					subscribeOnce,
					operationName,
					input,
				});
			}
			return () => {
				unsubscribe?.();
			};
		}, [enabled, _key]);

		return response;
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
