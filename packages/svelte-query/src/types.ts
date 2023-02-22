import type {
	ClientResponse,
	SubscriptionRequestOptions,
	OperationRequestOptions,
	FetchUserRequestOptions,
	OperationsDefinition,
	WithInput,
	ClientResponseError,
	UploadRequestOptions,
	UploadRequestOptionsWithProfile,
} from '@wundergraph/sdk/client';

import type {
	CreateQueryOptions as TanstackCreateQueryOptions,
	CreateQueryResult,
	CreateMutationOptions as TanstackCreateMutationOptions,
	CreateMutationResult,
} from '@tanstack/svelte-query';
import type { Writable } from 'svelte/store';

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
> = Omit<TanstackCreateQueryOptions<Data, Error, Data, (OperationName | Input | undefined)[]>, 'queryKey' | 'queryFn'> &
	WithInput<
		Input,
		{
			operationName: OperationName;
			liveQuery?: LiveQuery;
			input?: Input;
		}
	>;

export type CreateQuery<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['queries'], string>,
		Input extends Operations['queries'][OperationName]['input'] = Operations['queries'][OperationName]['input'],
		Data extends Operations['queries'][OperationName]['data'] = Operations['queries'][OperationName]['data'],
		LiveQuery extends Operations['queries'][OperationName]['liveQuery'] = Operations['queries'][OperationName]['liveQuery']
	>(
		options: CreateQueryOptions<Data, ClientResponseError, Input, OperationName, LiveQuery> & ExtraOptions
	): CreateQueryResult<Data, ClientResponseError> & {
		subscriptionState?: Writable<{
			isLoading: boolean;
			isSubscribed: boolean;
		}>;
	};
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

export type CreateSubscription<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['subscriptions'], string>,
		Input extends Operations['subscriptions'][OperationName]['input'] = Operations['subscriptions'][OperationName]['input'],
		Data extends Operations['subscriptions'][OperationName]['data'] = Operations['subscriptions'][OperationName]['data']
	>(
		options: UseSubscriptionOptions<Data | undefined, ClientResponseError, Input, OperationName> & ExtraOptions
	): CreateSubscriptionResult<Data, ClientResponseError>;
};

export type CreateSubscriptionResult<Data, Error = ClientResponseError> = CreateQueryResult<Data, Error> & {
	subscriptionState: Writable<{
		isLoading: boolean;
		isSubscribed: boolean;
	}>;
};

export type UseMutationOptions<Data, Error, Input, OperationName extends string> = Omit<
	TanstackCreateMutationOptions<Data, Error, Input, (OperationName | Input | undefined)[]>,
	'mutationKey' | 'mutationFn'
> & {
	operationName: OperationName;
};

export type CreateMutation<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['mutations'], string>,
		Input extends Operations['mutations'][OperationName]['input'] = Operations['mutations'][OperationName]['input'],
		Data extends Operations['mutations'][OperationName]['data'] = Operations['mutations'][OperationName]['data']
	>(
		options: UseMutationOptions<Data, ClientResponseError, Input, OperationName> & ExtraOptions
	): CreateMutationResult<Data, ClientResponseError, Input>;
};

export interface UseUserOptions<User>
	extends FetchUserRequestOptions,
		TanstackCreateQueryOptions<User, ClientResponseError, User, [string]> {
	enabled?: boolean;
}

export type GetUser<Operations extends OperationsDefinition> = {
	(options?: UseUserOptions<Operations['user']>): CreateQueryResult<Operations['user'], ClientResponseError>;
};

export type UseUploadOptions = Omit<
	TanstackCreateMutationOptions<string[], ClientResponseError, UploadRequestOptions, 'uploadFiles'>,
	'fetcher'
>;

export type CreateFileUpload<Operations extends OperationsDefinition> = {
	(options?: UseUploadOptions): Omit<
		TanstackCreateMutationOptions<string[], ClientResponseError, UploadRequestOptions>,
		'mutate'
	> & {
		upload: <
			ProviderName extends Extract<keyof Operations['s3Provider'], string>,
			ProfileName extends Extract<keyof Operations['s3Provider'][ProviderName]['profiles'], string> = Extract<
				keyof Operations['s3Provider'][ProviderName]['profiles'],
				string
			>,
			Meta extends Operations['s3Provider'][ProviderName]['profiles'][ProfileName] = Operations['s3Provider'][ProviderName]['profiles'][ProfileName]
		>(
			options: ProfileName extends string
				? UploadRequestOptionsWithProfile<ProviderName, ProfileName, Meta>
				: UploadRequestOptions<ProviderName>,
			config?: UseUploadOptions
		) => Promise<string[]>;

		uploadAsync: <
			ProviderName extends Extract<keyof Operations['s3Provider'], string>,
			ProfileName extends Extract<keyof Operations['s3Provider'][ProviderName]['profiles'], string> = Extract<
				keyof Operations['s3Provider'][ProviderName]['profiles'],
				string
			>,
			Meta extends Operations['s3Provider'][ProviderName]['profiles'][ProfileName] = Operations['s3Provider'][ProviderName]['profiles'][ProfileName]
		>(
			options: Operations['s3Provider'][ProviderName]['hasProfiles'] extends true
				? UploadRequestOptionsWithProfile<ProviderName, ProfileName, Meta>
				: UploadRequestOptions<ProviderName>,
			config?: UseUploadOptions
		) => Promise<string[]>;
	};
};

export interface SubscribeToOptions extends SubscriptionRequestOptions {
	onResult(response: ClientResponse): void;
	onSuccess?(response: ClientResponse): void;
	onError?(error: ClientResponseError): void;
	onAbort?(): void;
}

export interface CreateSubscribeToProps extends SubscriptionRequestOptions {
	queryHash: string;
	enabled?: boolean;
	resetOnMount?: boolean;
	onSuccess?(response: ClientResponse): void;
	onError?(error: ClientResponseError): void;
}
