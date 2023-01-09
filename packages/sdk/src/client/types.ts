import { GraphQLResponseError } from './GraphQLResponseError';
import { ResponseError } from './ResponseError';

import { S3UploadProfile, S3UploadProfiles } from '../configure/index';
export type { S3UploadProfile, S3UploadProfiles };

export type Headers = { [key: string]: string };

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export interface OperationMetadata {
	[key: string]: {
		requiresAuthentication: boolean;
	};
}

// base interface for the untyped client
export interface ClientOperation {
	input?: object;
	liveQuery?: boolean;
	data: any;
	requiresAuthentication: boolean;
}

export interface S3ProviderDefinition {
	[provider: string]: {
		[profile: string]: object;
	};
}

export interface OperationsDefinition<
	Queries extends OperationDefinition = OperationDefinition,
	Mutations extends OperationDefinition = OperationDefinition,
	Subscriptions extends OperationDefinition = OperationDefinition,
	UserRole extends string = string,
	S3Provider extends S3ProviderDefinition = S3ProviderDefinition,
	AuthProvider extends string = string
> {
	user: User<UserRole>;
	s3Provider: S3Provider;
	authProvider: AuthProvider;
	queries: Queries;
	mutations: Mutations;
	subscriptions: Subscriptions;
}

export interface OperationDefinition {
	[key: string]: ClientOperation;
}

export interface ClientConfig {
	applicationHash: string;
	baseURL: string;
	sdkVersion: string;
	customFetch?: (input: RequestInfo, init?: RequestInit) => Promise<globalThis.Response>;
	extraHeaders?: Headers;
	operationMetadata?: OperationMetadata;
}

type PrivateConfigProperties = 'applicationHash' | 'sdkVersion' | 'operationMetadata';
export type CreateClientConfig = Partial<Omit<ClientConfig, PrivateConfigProperties>>;

export type SubscriptionEventHandler<Data = any> = (resp: ClientResponse<Data>) => void;

export interface GraphQLErrorLocation {
	line: number;
	column: number;
}

export interface GraphQLError {
	message: string;
	location?: ReadonlyArray<GraphQLErrorLocation>;
	path?: ReadonlyArray<string | number>;
}

export interface ClientResponse<ResponseData = any> {
	data?: ResponseData;
	error?: Error | GraphQLResponseError | ResponseError;
}

export interface GraphQLResponse<
	ResponseData extends { [key: string]: any } = any,
	ResponseError extends GraphQLError = GraphQLError
> {
	data?: ResponseData;
	errors?: ResponseError[];
}

export interface OperationRequestOptions<
	OperationName extends string = any,
	Input extends object | undefined = object | undefined
> {
	operationName: OperationName;
	abortSignal?: AbortSignal;
	input?: Input;
}

export interface QueryRequestOptions<
	OperationName extends string = any,
	Input extends object | undefined = object | undefined
> extends OperationRequestOptions<OperationName, Input> {
	subscribeOnce?: Boolean;
}

export interface SubscriptionRequestOptions<
	OperationName extends string = any,
	Input extends object | undefined = object | undefined
> extends OperationRequestOptions<OperationName, Input> {
	liveQuery?: Boolean;
	subscribeOnce?: Boolean;
}

export interface SubscriptionResult {
	streamState: 'streaming' | 'stopped' | 'restarting';
	data: any;
}

export type UploadRequestOptions<
	ProviderName extends string = any,
	ProfileName extends string = any,
	Meta extends object = object
> = {
	provider: ProviderName;
	files: FileList;
	abortSignal?: AbortSignal;
	profile?: ProfileName;
	meta?: Meta;
};

export interface UploadResponse {
	fileKeys: string[];
}

export interface FetchUserRequestOptions {
	abortSignal?: AbortSignal;
	revalidate?: boolean;
}

export interface User<Role extends string = string> {
	provider?: string;
	providerId?: string;
	email?: string;
	emailVerified?: boolean;
	name?: string;
	firstName?: string;
	lastName?: string;
	nickName?: string;
	description?: string;
	userId?: string;
	avatarUrl?: string;
	location?: string;
	roles?: Role[];
	customAttributes?: string[];
	customClaims?: {
		[key: string]: any;
	};
	accessToken?: JSONObject;
	idToken?: JSONObject;
	rawIdToken?: string;
}

export interface LogoutOptions {
	logoutOpenidConnectProvider?: boolean;
}
