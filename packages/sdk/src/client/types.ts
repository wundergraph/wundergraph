import { ClientResponseError } from './ClientResponseError';
import type { RequiredKeysOf, SetRequired } from 'type-fest';

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
		hasProfiles: boolean;
		profiles: {
			[profile: string]: object;
		};
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
	csrfEnabled?: boolean;
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
	error?: ClientResponseError;
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

export type QueryRequestOptions<
	OperationName extends string = any,
	Input extends object | undefined = object | undefined
> = WithInput<Input, OperationRequestOptions<OperationName, Input>> & {
	subscribeOnce?: Boolean;
};

export type MutationRequestOptions<
	OperationName extends string = any,
	Input extends object | undefined = object | undefined
> = WithInput<Input, OperationRequestOptions<OperationName, Input>>;

export type SubscriptionRequestOptions<
	OperationName extends string = any,
	Input extends object | undefined = object | undefined
> = WithInput<Input, OperationRequestOptions<OperationName, Input>> & {
	liveQuery?: Boolean;
	subscribeOnce?: Boolean;
};

export interface SubscriptionResult {
	streamState: 'streaming' | 'stopped' | 'restarting';
	data: any;
}

export interface UploadRequestOptions<ProviderName extends string = string> {
	provider: ProviderName;
	files: FileList;
	abortSignal?: AbortSignal;
}

export interface UploadRequestOptionsWithProfile<
	ProviderName extends string = string,
	ProfileName extends string = string,
	Meta extends object = object
> extends UploadRequestOptions<ProviderName> {
	provider: ProviderName;
	profile: ProfileName;
	files: FileList;
	abortSignal?: AbortSignal;
	meta?: Meta;
}

export interface UploadResponse {
	fileKeys: string[];
}

export interface FetchUserRequestOptions {
	abortSignal?: AbortSignal;
	revalidate?: boolean;
}

export interface User<Role extends string = any, CustomClaims extends {} = {}> {
	provider?: string;
	providerId?: string;
	userId?: string;
	name?: string;
	firstName?: string;
	lastName?: string;
	middleName?: string;
	nickName?: string;
	preferredUsername?: string;
	profile?: string;
	picture?: string;
	website?: string;
	email?: string;
	emailVerified?: boolean;
	gender?: string;
	birthDate?: string;
	zoneInfo?: string;
	locale?: string;
	location?: string;

	roles?: Role[];
	customAttributes?: string[];
	customClaims?: {
		[key: string]: any;
	} & CustomClaims;
	accessToken?: JSONObject;
	rawAccessToken?: string;
	idToken?: JSONObject;
	rawIdToken?: string;
}

export interface LogoutOptions {
	/**
	 * Whether to log out the user from the OpenID Connect provider.
	 * Some providers might require the user to visit a URL. See
	 * the redirect field.
	 */
	logoutOpenidConnectProvider?: boolean;
	/**
	 * Custom function for redirecting the client to the log out
	 * URL. If not provided, window.location.href is updated.
	 */
	redirect?: (url: string) => Promise<boolean>;
	/**
	 * Callback to be run after a succesful logout
	 * */
	after?: () => void;
}

export type HasRequiredInput<Input extends object | undefined> = Input extends object
	? RequiredKeysOf<Input> extends never
		? false
		: true
	: false;

export type WithInput<
	Input extends object | undefined,
	Options extends { input?: Input }
> = HasRequiredInput<Input> extends true ? SetRequired<Options, 'input'> : Options;
