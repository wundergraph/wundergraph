import { createClient, Mutations, Queries, Subscriptions } from '../components/generated/client';
import useSWR, { mutate, SWRConfiguration, SWRResponse, MutatorOptions } from 'swr';
import { ClientQueryArgs, ClientMutationArgs, QueryProps, ResultError, MutationProps } from '@wundergraph/sdk/client';
import { serialize } from '@wundergraph/sdk/internal';
import { useEffect } from 'react';

const client = createClient();

const queryFetcher = async <
	OperationName extends keyof Queries,
	Input extends Queries[OperationName]['input'] = Queries[OperationName]['input']
>(
	query: QueryProps<OperationName, ClientQueryArgs<Input>>
) => {
	const result = await client.query(query);

	if (result.status === 'error' || result.status === 'partial') {
		throw new Error(result.errors[0].message);
	}

	return result.data;
};

const mutationFetcher = async <
	OperationName extends keyof Mutations,
	Input extends Mutations[OperationName]['input'] = Mutations[OperationName]['input']
>(
	mutation: MutationProps<OperationName, ClientMutationArgs<Input>>
) => {
	const result = await client.mutate(mutation);

	if (result.status === 'error' || result.status === 'partial') {
		throw new Error(result.errors[0].message);
	}

	return result.data;
};

export interface UseQueryOptions<LiveQuery> extends SWRConfiguration {
	isLiveQuery?: LiveQuery;
	enabled?: boolean;
}

export const useQuery = <
	OperationName extends keyof Queries,
	Input extends Queries[OperationName]['input'] = Queries[OperationName]['input'],
	Data extends Queries[OperationName]['data'] = Queries[OperationName]['data'],
	LiveQuery extends Queries[OperationName]['liveQuery'] = Queries[OperationName]['liveQuery']
>(
	operationName: OperationName,
	input: Input,
	options: UseQueryOptions<LiveQuery> = {}
): SWRResponse<Data, ResultError> => {
	const { isLiveQuery, enabled = true, ...config } = options;
	const key = { operationName, input };
	const [_key] = serialize(key);
	const response = useSWR(enabled ? key : null, !isLiveQuery ? queryFetcher : null, config);

	useEffect(() => {
		let unsubscribe: () => void;
		if (isLiveQuery && enabled) {
			unsubscribe = subscribeTo(operationName, input, { isLiveQuery: true });
		}
		return () => {
			unsubscribe?.();
		};
	}, [isLiveQuery, enabled, _key]);

	return response;
};

export const useMutation = <
	OperationName extends keyof Mutations,
	Input extends Mutations[OperationName]['input'] = Mutations[OperationName]['input'],
	Data extends Mutations[OperationName]['data'] = Mutations[OperationName]['data']
>(
	operationName: OperationName,
	config?: SWRConfiguration
) => {
	const response = useSWR(operationName, null, config);

	return {
		...response,
		async mutate(input: Input, options?: MutatorOptions<Data>) {
			return response.mutate(async () => {
				return mutationFetcher<any>({ operationName, input });
			}, options);
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
const subscribeTo = <OperationName = any, Input = any, Data = any>(
	operationName: OperationName,
	input: Input,
	options: { isLiveQuery?: boolean } = {}
) => {
	const abort = new AbortController();
	const key = { operationName, input };
	const { isLiveQuery } = options;
	client.subscribe<any, any, any>({ operationName, input, abortSignal: abort.signal, isLiveQuery }, (result) => {
		mutate(key, async () => {
			if (result.status === 'error' || result.status === 'partial') {
				throw new Error(result.errors[0].message);
			}
			return result.data;
		});
	});
	return () => {
		abort.abort();
	};
};

export interface UseSubscriptionOptions extends SWRConfiguration {
	enabled?: boolean;
}

export const useSubscription = <
	OperationName extends keyof Subscriptions,
	Input extends Subscriptions[OperationName]['input'] = Subscriptions[OperationName]['input'],
	Data extends Queries[OperationName]['data'] = Queries[OperationName]['data']
>(
	operationName: OperationName,
	input: Input,
	options: UseSubscriptionOptions = {}
): SWRResponse<Data, ResultError> => {
	const { enabled = true, ...config } = options;
	const key = { operationName, input };
	const [_key] = serialize(key);
	const response = useSWR(enabled ? key : null, null, config);

	useEffect(() => {
		let unsubscribe: () => void;
		if (enabled) {
			unsubscribe = subscribeTo(operationName, input);
		}
		return () => {
			unsubscribe?.();
		};
	}, [enabled, _key]);

	return response;
};
