import {
	ClientResponse,
	ExtractMeta,
	ExtractProfileName,
	FetchUserRequestOptions,
	OperationRequestOptions,
	OperationsDefinition,
	SubscriptionRequestOptions,
	UploadRequestOptions,
	UploadRequestOptionsWithProfile,
	WithInput,
} from '@wundergraph/sdk/client';

import {
	CreateQueryOptions as CreateTanstackQueryOptions,
	CreateMutationOptions as CreateTanstackMutationOptions,
	CreateQueryResult,
	CreateMutationResult,
	MutateOptions,
	QueryClient,
} from '@tanstack/solid-query';
import { ResponseError } from '@wundergraph/sdk/client';
import { Context } from 'solid-js';

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

export type CreateQueryOptions<
	Data,
	Error,
	Input extends object | undefined,
	OperationName extends string,
	LiveQuery
> = Omit<
	CreateTanstackQueryOptions<Data, Error, Data, () => (OperationName | Input | undefined)[]>,
	'queryKey' | 'queryFn' | 'queryHash' | 'queryKeyHashFn'
> &
	WithInput<
		Input,
		{
			operationName: OperationName;
			liveQuery?: LiveQuery;
			input?: Input;
		}
	>;

export type CreateQueryHook<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['queries'], string>,
		Input extends Operations['queries'][OperationName]['input'] = Operations['queries'][OperationName]['input'],
		Response extends Operations['queries'][OperationName]['response'] = Operations['queries'][OperationName]['response'],
		LiveQuery extends Operations['queries'][OperationName]['liveQuery'] = Operations['queries'][OperationName]['liveQuery']
	>(
		options: CreateQueryOptions<Response['data'], Response['error'], Input, OperationName, LiveQuery> & ExtraOptions
	): CreateQueryResult<Response['data'], Response['error']>;
};

export type CreateSubscriptionOptions<
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

export type CreateSubscriptionHook<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['subscriptions'], string>,
		Input extends Operations['subscriptions'][OperationName]['input'] = Operations['subscriptions'][OperationName]['input'],
		Response extends Operations['subscriptions'][OperationName]['response'] = Operations['subscriptions'][OperationName]['response']
	>(
		options: CreateSubscriptionOptions<Response['data'] | undefined, Response['error'], Input, OperationName> &
			ExtraOptions
	): CreateSubscriptionResult<Response['data'], Response['error']>;
};

export type CreateSubscriptionResult<Data, Error = ResponseError> = CreateQueryResult<Data, Error> & {
	isSubscribed: boolean;
};

export type CreateMutationOptions<Data, Error, Input, OperationName extends string> = Omit<
	CreateTanstackMutationOptions<Data, Error, Input, Context<QueryClient | undefined>>,
	'mutationKey' | 'mutationFn'
> & {
	operationName: OperationName;
};

export type CreateMutationHook<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['mutations'], string>,
		Input extends Operations['mutations'][OperationName]['input'] = Operations['mutations'][OperationName]['input'],
		Response extends Operations['mutations'][OperationName]['response'] = Operations['mutations'][OperationName]['response'],
		Context = unknown
	>(
		options: CreateMutationOptions<Response['data'], Response['error'], Input, OperationName> & ExtraOptions
	): CreateMutationResult<Response['data'], Response['error'], Input>;
};

export interface CreateSubscribeToProps extends SubscriptionRequestOptions {
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
		CreateTanstackQueryOptions<User, ResponseError, User, () => [string]> {
	enabled?: boolean;
}

export type UseUserHook<Operations extends OperationsDefinition> = {
	(options?: UseUserOptions<Operations['user']>): CreateQueryResult<Operations['user'], ResponseError>;
};

export type CreateUploadOptions = Omit<
	CreateTanstackMutationOptions<string[], ResponseError, UploadRequestOptions, Context<QueryClient | undefined>>,
	'mutationFn'
>;

export type CreateUploadHook<Operations extends OperationsDefinition> = {
	(options?: CreateUploadOptions): Omit<
		CreateTanstackMutationOptions<string[], ResponseError, UploadRequestOptions, Context<QueryClient | undefined>>,
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
			config?: MutateOptions<string[], ResponseError, UploadRequestOptions, Context<QueryClient | undefined>>
		) => void;

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
			config?: MutateOptions<string[], ResponseError, UploadRequestOptions, Context<QueryClient | undefined>>
		) => Promise<string[] | undefined>;
	};
};
