import {
	ClientResponse,
	ExtractMeta,
	ExtractProfileName,
	FetchUserRequestOptions,
	OperationRequestOptions,
	OperationsDefinition,
	SubscriptionRequestOptions,
	UploadRequestOptions,
	WithInput,
} from '@wundergraph/sdk/client';

import {
	UseQueryOptions as UseTanstackQueryOptions,
	UseMutationOptions as UseTanstackMutationOptions,
	UseQueryResult,
	UseMutationResult,
} from '@tanstack/react-query';
import { ResponseError } from '@wundergraph/sdk/client';

export type QueryFetcher<Operations extends OperationsDefinition> = {
	<
		OperationName extends Extract<keyof Operations['queries'], string>,
		Data extends Operations['queries'][OperationName]['response'] = Operations['queries'][OperationName]['response'],
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
		Data extends Operations['mutations'][OperationName]['response'] = Operations['mutations'][OperationName]['response'],
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

export type UseQueryOptions<
	Data,
	Error,
	Input extends object | undefined,
	OperationName extends string,
	LiveQuery
> = Omit<UseTanstackQueryOptions<Data, Error, Data, (OperationName | Input | undefined)[]>, 'queryKey' | 'queryFn'> &
	WithInput<
		Input,
		{
			operationName: OperationName;
			liveQuery?: LiveQuery;
			input?: Input;
		}
	>;

export type UseQueryHook<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['queries'], string>,
		Input extends Operations['queries'][OperationName]['input'] = Operations['queries'][OperationName]['input'],
		Response extends Operations['queries'][OperationName]['response'] = Operations['queries'][OperationName]['response'],
		LiveQuery extends Operations['queries'][OperationName]['liveQuery'] = Operations['queries'][OperationName]['liveQuery']
	>(
		options: UseQueryOptions<Response['data'], Response['error'], Input, OperationName, LiveQuery> & ExtraOptions
	): UseQueryResult<Response['data'], Response['error']> & { isSubscribed?: boolean };
};

export type UseSubscriptionOptions<
	Data,
	Error,
	Input extends object | undefined,
	OperationName extends string
> = WithInput<
	Input,
	{
		operationName: OperationName;
		subscribeOnce?: boolean;
		resetOnMount?: boolean;
		enabled?: boolean;
		input?: Input;
		onSuccess?(response: ClientResponse<Data>): void;
		onError?(error: Error): void;
	}
>;

export type UseSubscriptionHook<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['subscriptions'], string>,
		Input extends Operations['subscriptions'][OperationName]['input'] = Operations['subscriptions'][OperationName]['input'],
		Response extends Operations['subscriptions'][OperationName]['response'] = Operations['subscriptions'][OperationName]['response']
	>(
		options: UseSubscriptionOptions<Response['data'] | undefined, Response['error'], Input, OperationName> &
			ExtraOptions
	): UseSubscriptionResult<Response['data'], Response['error']>;
};

export type UseSubscriptionResult<Data, Error = ResponseError> = UseQueryResult<Data, Error> & {
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
		Response extends Operations['mutations'][OperationName]['response'] = Operations['mutations'][OperationName]['response']
	>(
		options: UseMutationOptions<Response['data'], Response['error'], Input, OperationName> & ExtraOptions
	): UseMutationResult<Response['data'], Response['error'], Input>;
};

export interface UseSubscribeToProps extends SubscriptionRequestOptions {
	queryHash: string;
	enabled?: boolean;
	resetOnMount?: boolean;
	onSuccess?(response: ClientResponse): void;
	onError?(error: ResponseError): void;
}

export interface SubscribeToOptions extends SubscriptionRequestOptions {
	onResult(response: ClientResponse): void;
	onSuccess?(response: ClientResponse): void;
	onError?(error: ResponseError): void;
	onAbort?(): void;
}

export interface UseUserOptions<User>
	extends FetchUserRequestOptions,
		UseTanstackQueryOptions<User, ResponseError, User, [string]> {
	enabled?: boolean;
}

export type UseUserHook<Operations extends OperationsDefinition> = {
	(options?: UseUserOptions<Operations['user']>): UseQueryResult<Operations['user'], ResponseError>;
};

export type UseUploadOptions = Omit<
	UseTanstackMutationOptions<string[], ResponseError, UploadRequestOptions, 'uploadFiles'>,
	'fetcher'
>;

export type UseUploadHook<Operations extends OperationsDefinition> = {
	(options?: UseUploadOptions): Omit<
		UseTanstackMutationOptions<string[], ResponseError, UploadRequestOptions>,
		'mutate'
	> & {
		upload: <
			ProviderName extends Extract<keyof Operations['s3Provider'], string>,
			ProfileName extends ExtractProfileName<Operations['s3Provider'][ProviderName]['profiles']> = ExtractProfileName<
				Operations['s3Provider'][ProviderName]['profiles']
			>,
			Meta extends ExtractMeta<Operations['s3Provider'][ProviderName]['profiles'], ProfileName> = ExtractMeta<
				Operations['s3Provider'][ProviderName]['profiles'],
				ProfileName
			>
		>(
			options: UploadRequestOptions<ProviderName, ProfileName, Meta>,
			config?: UseUploadOptions
		) => Promise<string[]>;

		uploadAsync: <
			ProviderName extends Extract<keyof Operations['s3Provider'], string>,
			ProfileName extends ExtractProfileName<Operations['s3Provider'][ProviderName]['profiles']> = ExtractProfileName<
				Operations['s3Provider'][ProviderName]['profiles']
			>,
			Meta extends ExtractMeta<Operations['s3Provider'][ProviderName]['profiles'], ProfileName> = ExtractMeta<
				Operations['s3Provider'][ProviderName]['profiles'],
				ProfileName
			>
		>(
			options: UploadRequestOptions<ProviderName, ProfileName, Meta>,
			config?: UseUploadOptions
		) => Promise<string[]>;
	};
};
