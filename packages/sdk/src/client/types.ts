import { GraphQLResponseError } from './GraphQLResponseError';

export type Headers = { [key: string]: string };

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export interface OperationMetadata {
	[key: string]: {
		requiresAuthentication: boolean;
	};
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

export interface GraphQLError {
	message: string;
}

export interface ClientResponse<ResponseData = any> {
	data?: ResponseData;
	error?: Error | GraphQLResponseError;
}

export interface GraphQLResponse<
	ResponseData extends { [key: string]: any } = any,
	ResponseError extends GraphQLError = GraphQLError
> {
	data?: ResponseData;
	errors?: ResponseError[];
}

export interface OperationRequestOptions<
	OperationName extends string = string,
	Input extends object | undefined = object | undefined
> {
	operationName: OperationName;
	abortSignal?: AbortSignal;
	input?: Input;
}

export interface SubscriptionRequestOptions<
	OperationName extends string = string,
	Input extends object | undefined = object | undefined
> extends OperationRequestOptions<OperationName, Input> {
	liveQuery?: Boolean;
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
