import { createClient, Mutations, Queries, Subscriptions } from '../components/generated/client';
import useSWR, { mutate, SWRConfiguration, SWRResponse, MutatorOptions } from 'swr';
import {
	OperationRequestOptions,
	SubscriptionRequestOptions,
	GraphQLResponseError,
	ClientResponse,
} from '@wundergraph/sdk/client';
import { serialize } from '@wundergraph/sdk/internal';
import { useEffect } from 'react';

const client = createClient();

const queryFetcher = async <
	OperationName extends keyof Queries,
	Data extends Queries[OperationName]['data'] = Queries[OperationName]['data'],
	RequestOptions extends OperationRequestOptions<
		keyof Queries,
		Queries[OperationName]['input']
	> = OperationRequestOptions<keyof Queries, Queries[OperationName]['input']>
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
	OperationName extends keyof Mutations,
	Data extends Mutations[OperationName]['data'] = Mutations[OperationName]['data'],
	RequestOptions extends OperationRequestOptions<
		keyof Mutations,
		Mutations[OperationName]['input']
	> = OperationRequestOptions<keyof Mutations, Mutations[OperationName]['input']>
>(
	mutation: RequestOptions
) => {
	const result = await client.mutate<RequestOptions, Data>(mutation);

	if (result.error) {
		throw result.error;
	}

	return result.data;
};

export type UseQueryOptions<OperationName, Input, LiveQuery> = SWRConfiguration & {
	operationName: OperationName;
	liveQuery?: LiveQuery;
	enabled?: boolean;
} & (Input extends object ? { input: Input } : unknown);

export const useQuery = <
	OperationName extends keyof Queries,
	Input extends Queries[OperationName]['input'] = Queries[OperationName]['input'],
	Data extends Queries[OperationName]['data'] = Queries[OperationName]['data'],
	LiveQuery extends Queries[OperationName]['liveQuery'] = Queries[OperationName]['liveQuery']
>(
	options: UseQueryOptions<OperationName, Input, LiveQuery>
) => {
	const _options = {
		input: undefined,
		...options,
	};
	const { operationName, liveQuery, enabled = true, input, ...swrConfig } = _options;
	const key = { operationName, input };
	const [_key] = serialize(key);
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

export type UseMutationOptions<OperationName> = SWRConfiguration & {
	operationName: OperationName;
};
export type MutateOptions<Input, Data> = MutatorOptions<Data> & (Input extends object ? { input: Input } : unknown);

export const useMutation = <
	OperationName extends keyof Mutations,
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

export type UseSubscriptionOptions<OperationName, Input> = SWRConfiguration & {
	operationName?: OperationName;
	enabled?: boolean;
} & (Input extends object ? { input: Input } : {});

export const useSubscription = <
	OperationName extends keyof Subscriptions,
	Input extends Subscriptions[OperationName]['input'] = Subscriptions[OperationName]['input'],
	Data extends Queries[OperationName]['data'] = Queries[OperationName]['data']
>(
	operationName: OperationName,
	options: UseSubscriptionOptions<OperationName, Input>
): SWRResponse<Data, GraphQLResponseError> => {
	const _options = {
		input: undefined,
		...options,
	};
	const { enabled = true, input, ...swrConfig } = _options;
	const key = { operationName, input };
	const [_key] = serialize(key);
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
