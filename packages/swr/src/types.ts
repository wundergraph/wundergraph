import { ClientResponse, GraphQLResponseError, SubscriptionRequestOptions } from '@wundergraph/sdk/client';
import { Key, SWRConfiguration, SWRResponse } from 'swr';
import { SWRMutationConfiguration } from 'swr/mutation';

export type UseQueryOptions<Data, Error, Input, OperationName extends string, LiveQuery> = Omit<
	SWRConfiguration<Data, Error>,
	'fetcher'
> & {
	operationName: OperationName;
	liveQuery?: LiveQuery;
	enabled?: boolean;
	input?: Input;
};

export type UseSubscriptionOptions<Data, Error, Input, OperationName extends string> = {
	operationName: OperationName;
	subscribeOnce?: boolean;
	enabled?: boolean;
	input?: Input;
	onSuccess?(
		response: ClientResponse<Data>,
		key: Key,
		config: UseSubscriptionOptions<Data, Error, Input, OperationName>
	): void;
	onError?(error: Error, key: Key, config: UseSubscriptionOptions<Data, Error, Input, OperationName>): void;
};

export type UseSubscriptionResponse<Data, Error = GraphQLResponseError> = Omit<
	SWRResponse<Data, Error>,
	'isValidating' | 'mutate'
> & {
	isSubscribed: boolean;
};

export type UseMutationOptions<Data, Error, Input, OperationName extends string> = Omit<
	SWRMutationConfiguration<Data, Error, Input, OperationName>,
	'fetcher'
> & {
	operationName: OperationName;
};

export interface UseSubscribeToProps extends SubscriptionRequestOptions {
	mutationKey: string;
	enabled?: boolean;
	onSuccess?(response: ClientResponse): void;
	onError?(error: GraphQLResponseError): void;
}

export interface SubscribeToOptions extends SubscriptionRequestOptions {
	onResult(response: ClientResponse): void;
	onSuccess?(response: ClientResponse): void;
	onError?(error: GraphQLResponseError): void;
	onAbort?(): void;
}
