import type { RequiredKeysOf, SetRequired } from 'type-fest';
import { GraphQLError } from './errors';
import { WunderGraphUser } from '../server';

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
	response: ClientResponse;
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
	LiveQueries extends OperationDefinition = OperationDefinition,
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
	liveQueries: LiveQueries;
}

export interface OperationDefinition {
	[key: string]: ClientOperation;
}

export interface ClientConfig {
	applicationHash?: string;
	baseURL: string;
	sdkVersion?: string;
	customFetch?: (input: RequestInfo, init?: RequestInit) => Promise<globalThis.Response>;
	extraHeaders?: Headers;
	operationMetadata?: OperationMetadata;
	/**
	 * Specifies the number of milliseconds before the request times out.
	 * default is `0` (no timeout)
	 */
	requestTimeoutMs?: number;
	csrfEnabled?: boolean;
	/**
	 * Force SSE for subscriptions if extraHeaders are set.
	 * Subscriptions fall back to fetch streaming by default
	 * if extraHeaders are set, because EventSource does not
	 * supported headers.
	 */
	forceSSE?: boolean;
}

type PrivateConfigProperties = 'applicationHash' | 'sdkVersion' | 'operationMetadata' | 'operationErrorTypes';
export type CreateClientConfig = Partial<Omit<ClientConfig, PrivateConfigProperties>>;

export type SubscriptionEventHandler<Data = any, ResponseError = any> = (
	resp: ClientResponse<Data, ResponseError>
) => void;

export interface ClientResponse<Data = any, Error = any> {
	data?: Data;
	error?: Error;
}

export interface GraphQLResponse<ResponseData extends JSONObject = any, ResponseError extends GraphQLError = any> {
	data?: ResponseData;
	errors?: ResponseError[];
}

export interface OperationRequestOptions<
	OperationName extends string = any,
	Input extends object | undefined = object | undefined
> {
	operationName: OperationName;
	/**
	 * If you pass an AbortSignal, the request will be aborted when the signal is aborted.
	 * You are responsible of handling the request timeout if you want to pass a custom AbortSignal.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
	 */
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
	/**
	 * Subscribe to a live query
	 */
	liveQuery?: Boolean;
	/**
	 * Receive the initial response and then stop the subscription
	 */
	subscribeOnce?: Boolean;
};

export interface SubscriptionResult {
	streamState: 'streaming' | 'stopped' | 'restarting';
	data: any;
}

export type UploadRequestOptions<ProviderName = any, ProfileName = any, Meta = any> = ProfileName extends
	| never
	| undefined
	? { provider: ProviderName; files: FileList; abortSignal?: AbortSignal; profile?: ProfileName; meta?: Meta }
	: { provider: ProviderName; files: FileList; abortSignal?: AbortSignal; profile: ProfileName; meta?: Meta };

/**
 * @deprecated use `UploadRequestOptions` instead
 */
export type UploadRequestOptionsWithProfile<ProviderName, ProfileName, Meta> = UploadRequestOptions<
	ProviderName,
	ProfileName,
	Meta
>;

export interface UploadResponse {
	fileKeys: string[];
}

export type ExtractProfileName<Profile> = keyof Profile extends never ? undefined : Extract<keyof Profile, string>;
export type ExtractMeta<
	Profiles extends Record<string, object>,
	ProfileName extends string | undefined
> = ProfileName extends string ? Profiles[ProfileName] : never;

export interface FetchUserRequestOptions {
	abortSignal?: AbortSignal;
	revalidate?: boolean;
}

export type User<Role extends string = any, CustomClaims extends {} = {}> = WunderGraphUser<Role, CustomClaims>;
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
	/**
	 * Whether the federated parameter should be appended to the logout request
	 * https://auth0.com/docs/authenticate/login/logout/log-users-out-of-idps#alternative-logout
	 * */
	isFederated?: boolean;
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
