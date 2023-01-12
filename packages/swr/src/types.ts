import {
	Client,
	ClientResponse,
	FetchUserRequestOptions,
	GraphQLResponseError,
	OperationRequestOptions,
	OperationsDefinition,
	SubscriptionRequestOptions,
	UploadRequestOptions,
	User,
} from '@wundergraph/sdk/client';
import { UploadRequestOptionsWithProfile } from '@wundergraph/sdk/dist/client/types';
import { Key, SWRConfiguration, SWRResponse } from 'swr';
import { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation';

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

export type UseQueryOptions<Data, Error, Input, OperationName extends string, LiveQuery> = Omit<
	SWRConfiguration<Data, Error>,
	'fetcher'
> & {
	operationName: OperationName;
	liveQuery?: LiveQuery;
	enabled?: boolean;
	input?: Input;
};

export type UseQueryHook<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['queries'], string>,
		Input extends Operations['queries'][OperationName]['input'] = Operations['queries'][OperationName]['input'],
		Data extends Operations['queries'][OperationName]['data'] = Operations['queries'][OperationName]['data'],
		LiveQuery extends Operations['queries'][OperationName]['liveQuery'] = Operations['queries'][OperationName]['liveQuery']
	>(
		options: UseQueryOptions<Data, GraphQLResponseError, Input, OperationName, LiveQuery> & ExtraOptions
	): SWRResponse<Data, GraphQLResponseError>;
};

export type UseSubscriptionOptions<Data, Error, Input, OperationName extends string> = {
	operationName: OperationName;
	subscribeOnce?: boolean;
	resetOnMount?: boolean;
	enabled?: boolean;
	input?: Input;
	onSuccess?(
		response: ClientResponse<Data>,
		key: Key,
		config: UseSubscriptionOptions<Data, Error, Input, OperationName>
	): void;
	onError?(error: Error, key: Key, config: UseSubscriptionOptions<Data, Error, Input, OperationName>): void;
};

export type UseSubscriptionHook<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['subscriptions'], string>,
		Input extends Operations['subscriptions'][OperationName]['input'] = Operations['subscriptions'][OperationName]['input'],
		Data extends Operations['subscriptions'][OperationName]['data'] = Operations['subscriptions'][OperationName]['data']
	>(
		options: UseSubscriptionOptions<Data | undefined, GraphQLResponseError, Input, OperationName> & ExtraOptions
	): UseSubscriptionResponse<Data, GraphQLResponseError>;
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

export type UseMutationHook<Operations extends OperationsDefinition, ExtraOptions extends object = {}> = {
	<
		OperationName extends Extract<keyof Operations['mutations'], string>,
		Input extends Operations['mutations'][OperationName]['input'] = Operations['mutations'][OperationName]['input'],
		Data extends Operations['mutations'][OperationName]['data'] = Operations['mutations'][OperationName]['data']
	>(
		options: UseMutationOptions<Data, GraphQLResponseError, Input, OperationName> & ExtraOptions
	): SWRMutationResponse<Data, GraphQLResponseError, Input>;
};

export interface UseSubscribeToProps extends SubscriptionRequestOptions {
	mutationKey: string;
	enabled?: boolean;
	resetOnMount?: boolean;
	onSuccess?(response: ClientResponse): void;
	onError?(error: GraphQLResponseError): void;
}

export interface SubscribeToOptions extends SubscriptionRequestOptions {
	onResult(response: ClientResponse): void;
	onSuccess?(response: ClientResponse): void;
	onError?(error: GraphQLResponseError): void;
	onAbort?(): void;
}

export interface UseUserOptions<User> extends FetchUserRequestOptions, SWRConfiguration<User> {
	enabled?: boolean;
}

export type UseUserHook<Operations extends OperationsDefinition> = {
	(options?: UseUserOptions<Operations['user']>): SWRResponse<Operations['user'], GraphQLResponseError>;
};

export type UseUploadOptions = Omit<
	SWRMutationConfiguration<string[], GraphQLResponseError, UploadRequestOptions, 'uploadFiles'>,
	'fetcher'
>;

export type UseUploadHook<Operations extends OperationsDefinition> = {
	(config?: UseUploadOptions): Omit<
		SWRMutationResponse<string[], GraphQLResponseError, UploadRequestOptions>,
		'trigger'
	> & {
		upload: <
			ProviderName extends Extract<keyof Operations['s3Provider'], string>,
			ProfileName extends Extract<keyof Operations['s3Provider'][ProviderName]['profiles'], string> = Extract<
				keyof Operations['s3Provider'][ProviderName]['profiles'],
				string
			>,
			Meta extends Operations['s3Provider'][ProviderName]['profiles'][ProfileName] = Operations['s3Provider'][ProviderName]['profiles'][ProfileName]
		>(
			options: Operations['s3Provider'][ProviderName]['hasProfiles'] extends true
				? UploadRequestOptionsWithProfile<ProviderName, ProfileName, Meta>
				: UploadRequestOptions,
			config?: UseUploadOptions
		) => Promise<string[]>;
	};
};

// type Test<ProfileName> =
