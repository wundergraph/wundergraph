import {
	ClientResponse,
	FetchUserRequestOptions,
	OperationRequestOptions,
	OperationsDefinition,
	SubscriptionRequestOptions,
	UploadRequestOptions,
} from '@wundergraph/sdk/client';
import { Key, SWRConfiguration, SWRResponse } from 'swr';
import { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation';
import { ResponseError } from '@wundergraph/sdk/client';
import type { WithInput, ExtractProfileName, ExtractMeta } from '@wundergraph/sdk/client';

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

export type UseQueryOptions<
	Data,
	Error,
	Input extends object | undefined,
	OperationName extends string,
	LiveQuery
> = Omit<SWRConfiguration<Data, Error>, 'fetcher'> &
	WithInput<
		Input,
		{
			operationName: OperationName;
			liveQuery?: LiveQuery;
			enabled?: boolean;
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
	): SWRResponse<Response['data'], Response['error']>;
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
		onSuccess?(
			response: ClientResponse<Data>,
			key: Key,
			config: UseSubscriptionOptions<Data, Error, Input, OperationName>
		): void;
		onError?(error: ResponseError, key: Key, config: UseSubscriptionOptions<Data, Error, Input, OperationName>): void;
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
	): UseSubscriptionResponse<Response['data'], Response['error']>;
};

export type UseSubscriptionResponse<Data, Error = ResponseError> = Omit<
	SWRResponse<Data, Error>,
	'isValidating' | 'mutate'
> & {
	isSubscribed: boolean;
};

export type UseMutationOptions<Data, Error, Input, OperationName extends string> = Omit<
	SWRMutationConfiguration<Data, Error, OperationName, Input>,
	'fetcher'
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
	): SWRMutationResponse<Response['data'], Response['error'], OperationName, Input>;
};

export interface UseSubscribeToProps extends SubscriptionRequestOptions {
	mutationKey: string;
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

export interface UseUserOptions<User> extends FetchUserRequestOptions, SWRConfiguration<User> {
	enabled?: boolean;
}

export type UseUserHook<Operations extends OperationsDefinition> = {
	(options?: UseUserOptions<Operations['user']>): SWRResponse<Operations['user'], ResponseError>;
};

export type UseUploadOptions = Omit<
	SWRMutationConfiguration<string[], ResponseError, 'uploadFiles', UploadRequestOptions>,
	'fetcher'
>;

export type UseUploadHook<Operations extends OperationsDefinition> = {
	(config?: UseUploadOptions): Omit<SWRMutationResponse<string[], ResponseError, UploadRequestOptions>, 'trigger'> & {
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
	};
};
