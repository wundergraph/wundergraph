import {
	ClientResponse,
	FetchUserRequestOptions,
	OperationRequestOptions,
	OperationsDefinition,
	SubscriptionRequestOptions,
	UploadRequestOptions,
} from '@wundergraph/sdk/client';

import {
	UseQueryOptions as UseTanstackQueryOptions,
	UseMutationOptions as UseTanstackMutationOptions,
	UseQueryResult,
	UseMutationResult,
} from '@tanstack/react-query';
import { ClientResponseError } from '@wundergraph/sdk/client';

export type QueryFetcher<Operations extends OperationsDefinition> = {
	<
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
	): Promise<Data>;
};

export type MutationFetcher<Operations extends OperationsDefinition> = {
	<
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
	): Promise<Data>;
};

export type QueryKey<Operations extends OperationsDefinition> = {
	<
		OperationName extends Extract<keyof Operations['queries'], string>,
		Input extends Operations['queries'][OperationName]['input'] = Operations['queries'][OperationName]['input']
	>(query: {
		operationName: OperationName;
		input?: Input;
	}): (OperationName | Input | undefined)[];
};

export type UseQueryOptions<Data, Error, Input, OperationName extends string, LiveQuery> = Omit<
	UseTanstackQueryOptions<Data, Error, Data, (OperationName | Input | undefined)[]>,
	'queryKey' | 'queryFn'
> & {
	operationName: OperationName;
	liveQuery?: LiveQuery;
	input?: Input;
};

export type UseQueryHook<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['queries'], string>,
		Input extends Operations['queries'][OperationName]['input'] = Operations['queries'][OperationName]['input'],
		Data extends Operations['queries'][OperationName]['data'] = Operations['queries'][OperationName]['data'],
		LiveQuery extends Operations['queries'][OperationName]['liveQuery'] = Operations['queries'][OperationName]['liveQuery']
	>(
		options: UseQueryOptions<Data, ClientResponseError, Input, OperationName, LiveQuery> & ExtraOptions
	): UseQueryResult<Data, ClientResponseError>;
};

export type UseSubscriptionOptions<Data, Error, Input, OperationName extends string> = {
	operationName: OperationName;
	subscribeOnce?: boolean;
	resetOnMount?: boolean;
	enabled?: boolean;
	input?: Input;
	onSuccess?(response: ClientResponse<Data>): void;
	onError?(error: Error): void;
};

export type UseSubscriptionHook<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['subscriptions'], string>,
		Input extends Operations['subscriptions'][OperationName]['input'] = Operations['subscriptions'][OperationName]['input'],
		Data extends Operations['subscriptions'][OperationName]['data'] = Operations['subscriptions'][OperationName]['data']
	>(
		options: UseSubscriptionOptions<Data | undefined, ClientResponseError, Input, OperationName> & ExtraOptions
	): UseSubscriptionResponse<Data, ClientResponseError>;
};

export type UseSubscriptionResponse<Data, Error = ClientResponseError> = UseQueryResult<Data, Error> & {
	isSubscribed: boolean;
};

export type UseMutationOptions<Data, Error, Input, OperationName extends string> = Omit<
	UseTanstackMutationOptions<Data, Error, Input, (OperationName | Input | undefined)[]>,
	'mutationKey' | 'mutationFn'
> & {
	operationName: OperationName;
};

export type UseMutationHook<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['mutations'], string>,
		Input extends Operations['mutations'][OperationName]['input'] = Operations['mutations'][OperationName]['input'],
		Data extends Operations['mutations'][OperationName]['data'] = Operations['mutations'][OperationName]['data']
	>(
		options: UseMutationOptions<Data, ClientResponseError, Input, OperationName> & ExtraOptions
	): UseMutationResult<Data, ClientResponseError, Input>;
};

export interface UseSubscribeToProps extends SubscriptionRequestOptions {
	queryHash: string;
	enabled?: boolean;
	resetOnMount?: boolean;
	onSuccess?(response: ClientResponse): void;
	onError?(error: ClientResponseError): void;
}

export interface SubscribeToOptions extends SubscriptionRequestOptions {
	onResult(response: ClientResponse): void;
	onSuccess?(response: ClientResponse): void;
	onError?(error: ClientResponseError): void;
	onAbort?(): void;
}

export interface UseUserOptions<User>
	extends FetchUserRequestOptions,
		UseTanstackQueryOptions<User, ClientResponseError, User, [string]> {
	enabled?: boolean;
}

export type UseUserHook<Operations extends OperationsDefinition> = {
	(options?: UseUserOptions<Operations['user']>): UseQueryResult<Operations['user'], ClientResponseError>;
};

export type UseUploadHook<Operations extends OperationsDefinition> = {
	(
		options?: Omit<
			UseTanstackMutationOptions<string[], ClientResponseError, UploadRequestOptions<Operations['s3Provider']>>,
			'fetcher'
		>
	): Omit<
		UseTanstackMutationOptions<string[], ClientResponseError, UploadRequestOptions<Operations['s3Provider']>>,
		'mutate'
	> & {
		upload: UseMutationResult<string[], ClientResponseError, UploadRequestOptions<Operations['s3Provider']>>['mutate'];
		uploadAsync: UseMutationResult<
			string[],
			ClientResponseError,
			UploadRequestOptions<Operations['s3Provider']>
		>['mutateAsync'];
	};
};
