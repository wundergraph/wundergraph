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
import { ClientResponseError } from '@wundergraph/sdk/client';
import { Context } from 'solid-js';

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
		Data extends Operations['queries'][OperationName]['data'] = Operations['queries'][OperationName]['data'],
		LiveQuery extends Operations['queries'][OperationName]['liveQuery'] = Operations['queries'][OperationName]['liveQuery']
	>(
		options: CreateQueryOptions<Data, ClientResponseError, Input, OperationName, LiveQuery> & ExtraOptions
	): CreateQueryResult<Data, ClientResponseError>;
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
		Data extends Operations['subscriptions'][OperationName]['data'] = Operations['subscriptions'][OperationName]['data']
	>(
		options: CreateSubscriptionOptions<Data | undefined, ClientResponseError, Input, OperationName> & ExtraOptions
	): CreateSubscriptionResult<Data, ClientResponseError>;
};

export type CreateSubscriptionResult<Data, Error = ClientResponseError> = CreateQueryResult<Data, Error> & {
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
		Data extends Operations['mutations'][OperationName]['data'] = Operations['mutations'][OperationName]['data'],
		Context = unknown
	>(
		options: CreateMutationOptions<Data, ClientResponseError, Input, OperationName> & ExtraOptions
	): CreateMutationResult<Data, ClientResponseError, Input>;
};

export interface CreateSubscribeToProps extends SubscriptionRequestOptions {
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
		CreateTanstackQueryOptions<User, ClientResponseError, User, () => [string]> {
	enabled?: boolean;
}

export type UseUserHook<Operations extends OperationsDefinition> = {
	(options?: UseUserOptions<Operations['user']>): CreateQueryResult<Operations['user'], ClientResponseError>;
};

export type CreateUploadOptions = Omit<
	CreateTanstackMutationOptions<string[], ClientResponseError, UploadRequestOptions, Context<QueryClient | undefined>>,
	'mutationFn'
>;

export type CreateUploadHook<Operations extends OperationsDefinition> = {
	(options?: CreateUploadOptions): Omit<
		CreateTanstackMutationOptions<
			string[],
			ClientResponseError,
			UploadRequestOptions,
			Context<QueryClient | undefined>
		>,
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
			config?: MutateOptions<string[], ClientResponseError, UploadRequestOptions, Context<QueryClient | undefined>>
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
			config?: MutateOptions<string[], ClientResponseError, UploadRequestOptions, Context<QueryClient | undefined>>
		) => Promise<string[] | undefined>;
	};
};
