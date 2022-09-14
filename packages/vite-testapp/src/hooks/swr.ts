import { createClient, Mutations, Queries, Subscriptions } from '../components/generated/client';
import useSWR, { mutate, SWRConfiguration, SWRResponse, MutatorOptions } from 'swr';
import {
	ClientQueryArgs,
	ClientMutationArgs,
	ClientSubscriptionArgs,
	QueryProps,
	ResultError,
	SubscriptionProps,
	SubscriptionResult,
	MutationProps,
} from '@wundergraph/sdk/client';
import { useEffect, useState } from 'react';

const client = createClient();

export const useQuery = <
	OperationName extends keyof Queries,
	Input extends Queries[OperationName]['input'] = Queries[OperationName]['input'],
	Data extends Queries[OperationName]['data'] = Queries[OperationName]['data']
>(
	operationName: OperationName,
	input: Input,
	config?: SWRConfiguration
): SWRResponse<Data, ResultError> => {
	return useSWR(
		{ operationName, input },
		async (query: QueryProps<OperationName, ClientQueryArgs<Input>>) => {
			const result = await client.query(query);

			if (result.data) {
				return result.data;
			}
		},
		config
	);
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
		async mutate(input: Input, options: MutatorOptions<Data>) {
			const result = await client.mutate({
				operationName,
				input,
			} as unknown as MutationProps<OperationName, ClientMutationArgs<Input>>);

			if (result.status === 'ok') {
				response.mutate(result.data, options);
			}

			return result.data;
		},
	};
};

export const useSubscription = <
	OperationName extends keyof Subscriptions,
	Input extends Subscriptions[OperationName]['input'] = Subscriptions[OperationName]['input'],
	Data extends Queries[OperationName]['data'] = Queries[OperationName]['data'],
	LiveQuery extends Subscriptions[OperationName]['isLiveQuery'] = Subscriptions[OperationName]['isLiveQuery']
>(
	operationName: OperationName,
	input: Input,
	config: SWRConfiguration & { isLiveQuery: LiveQuery }
): SWRResponse<Data, ResultError> => {
	const [key] = useState({ operationName, input, isLiveQuery: config?.isLiveQuery });
	const response = useSWR(key, null, config);
	useEffect(() => {
		const abort = new AbortController();
		client.subscribe(
			{ ...key, abortSignal: abort.signal } as unknown as SubscriptionProps<
				OperationName,
				ClientSubscriptionArgs<Input>,
				LiveQuery
			>,
			(result: SubscriptionResult<Data>) => {
				mutate(key, result.data);
			}
		);

		return () => {
			abort.abort();
		};
	}, [key]);

	return response;
};
