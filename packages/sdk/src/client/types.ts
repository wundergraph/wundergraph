import { GraphQLResponseError } from './GraphQLResponseError';
import { ResponseError } from './ResponseError';

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

export interface OperationsDefinition<
	Queries extends OperationDefinition = OperationDefinition,
	Mutations extends OperationDefinition = OperationDefinition,
	Subscriptions extends OperationDefinition = OperationDefinition,
	UserRole extends string = string,
	S3Provider extends string = string,
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
	applicationPath: string;
	baseURL: string;
	sdkVersion: string;
	customFetch?: (input: RequestInfo, init?: RequestInit) => Promise<globalThis.Response>;
	extraHeaders?: Headers;
	operationMetadata?: OperationMetadata;
}

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

export interface UploadRequestOptions<ProviderName extends string = string> {
	provider: ProviderName;
	files: FileList;
	abortSignal?: AbortSignal;
}

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
