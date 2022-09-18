import useSWR, { mutate, SWRConfiguration, SWRResponse, MutatorOptions } from 'swr';
import {
	OperationRequestOptions,
	SubscriptionRequestOptions,
	GraphQLResponseError,
	ClientResponse,
	ClientOperationDefs,
	Client,
} from '@wundergraph/sdk/client';
import { serialize } from '@wundergraph/sdk/internal';
import { useEffect } from 'react';

export type UseQueryOptions<OperationName, Input, LiveQuery> = SWRConfiguration & {
	operationName: OperationName;
	liveQuery?: LiveQuery;
	enabled?: boolean;
	input?: Input;
};

export type UseSubscriptionOptions<OperationName, Input> = SWRConfiguration & {
	operationName: OperationName;
	enabled?: boolean;
	input?: Input;
};

export type UseMutationOptions<OperationName> = SWRConfiguration & {
	operationName: OperationName;
};

export type MutateOptions<Input, Data> = MutatorOptions<Data> & { input?: Input };

export const createHooks = <
	Queries extends ClientOperationDefs,
	Mutations extends ClientOperationDefs,
	Subscriptions extends ClientOperationDefs
>(
	client: Client
) => {
	const queryFetcher = async <
		OperationName extends Extract<keyof Queries, string>,
		Data extends Queries[OperationName]['data'] = Queries[OperationName]['data'],
		RequestOptions extends OperationRequestOptions<
			Extract<keyof Queries, string>,
			Queries[OperationName]['input']
		> = OperationRequestOptions<Extract<keyof Queries, string>, Queries[OperationName]['input']>
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
		OperationName extends Extract<keyof Mutations, string>,
		Data extends Mutations[OperationName]['data'] = Mutations[OperationName]['data'],
		RequestOptions extends OperationRequestOptions<
			Extract<keyof Mutations, string>,
			Mutations[OperationName]['input']
		> = OperationRequestOptions<Extract<keyof Mutations, string>, Mutations[OperationName]['input']>
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
		OperationName extends Extract<keyof Queries, string>,
		Input extends Queries[OperationName]['input'] = Queries[OperationName]['input'],
		Data extends Queries[OperationName]['data'] = Queries[OperationName]['data'],
		LiveQuery extends Queries[OperationName]['liveQuery'] = Queries[OperationName]['liveQuery']
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
		OperationName extends Extract<keyof Mutations, string>,
		Input extends Mutations[OperationName]['input'] = Mutations[OperationName]['input'],
		Data extends Mutations[OperationName]['data'] = Mutations[OperationName]['data']
	>(
		options: UseMutationOptions<OperationName>
	) => {
		const { operationName, ...config } = options;
		const response = useSWR<Data, GraphQLResponseError>(operationName, null, config);

		return {
			...response,
			async mutate(options?: MutateOptions<Input, Data>): Promise<Data | undefined> {
				const _options = {
					...options,
				};
				const { input, ...swrOptions } = _options;
				return response.mutate(() => {
					return mutationFetcher({ operationName, input });
				}, swrOptions);
			},
		};
	};

	/**
	 * This is will subscribe to an operation and mutate the SWR state on result.
	 *
	 * @usage
	 * ```ts
	 * const unsubscribe = subscribeTo('Hello', {world: 'World'})
	 * ```
	 */
	const subscribeTo = (options: SubscriptionRequestOptions) => {
		const abort = new AbortController();

		options.abortSignal = abort.signal;

		client.subscribe(options, (result: ClientResponse) => {
			// Promise is not handled because we are not interested in the result
			// Errors are handled by SWR internally
			mutate({ operationName: options.operationName, input: options.input }, async () => {
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
		OperationName extends Extract<keyof Subscriptions, string>,
		Input extends Subscriptions[OperationName]['input'] = Subscriptions[OperationName]['input'],
		Data extends Subscriptions[OperationName]['data'] = Subscriptions[OperationName]['data']
	>(
		options: UseSubscriptionOptions<OperationName, Input>
	): SWRResponse<Data, GraphQLResponseError> => {
		const { enabled = true, operationName, input, ...swrConfig } = options;
		const key = { operationName, input };
		const _key = serialize(key);
		const response = useSWR(enabled ? key : null, null, swrConfig);

		useEffect(() => {
			let unsubscribe: () => void;
			if (enabled) {
				unsubscribe = subscribeTo({
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
		useMutation,
		useQuery,
		useSubscription,
	};
};
