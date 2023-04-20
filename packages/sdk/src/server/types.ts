import type { InternalClient, InternalClientFactory } from './internal-client';
import type { FastifyLoggerInstance } from 'fastify';
import type { Headers } from '@web-std/fetch';
import type { GraphQLServerConfig } from './plugins/graphql';
import type { ConfigurationVariable, WunderGraphConfiguration } from '@wundergraph/protobuf';
import type { WebhooksConfig } from '../webhooks/types';
import type { InputVariable } from '../configure/variables';
import type { ListenOptions, LoggerLevel, ResolvedListenOptions } from '../configure/options';
import { OperationsClient } from './operations-client';

declare module 'fastify' {
	interface FastifyRequest extends FastifyRequestContext {}
}

export type AuthenticationHookRequest<
	User extends WunderGraphUser = WunderGraphUser,
	IC extends InternalClient = InternalClient,
	InternalOperationsClient extends OperationsClient = OperationsClient
> = BaseRequestContext<User, IC, InternalOperationsClient> & AuthenticationRequestContext<User>;

export interface FastifyRequestContext<
	User extends WunderGraphUser = WunderGraphUser,
	IC extends InternalClient = InternalClient,
	InternalOperationsClient extends OperationsClient = OperationsClient
> {
	ctx: AuthenticationHookRequest<User, IC, InternalOperationsClient>;
}

export interface BaseRequestContext<
	User extends WunderGraphUser = WunderGraphUser,
	IC extends InternalClient = InternalClient,
	InternalOperationsClient extends OperationsClient = OperationsClient
> {
	/**
	 * The user that is currently logged in.
	 */
	user?: User;

	clientRequest: ClientRequest;
	/**
	 * The request logger.
	 */
	log: FastifyLoggerInstance;
	/**
	 * The internal client that is used to communicate with the server.
	 * @deprecated Use `operations` instead.
	 * @see https://wundergraph.com/docs/upgrade-guides/internal-client-deprecated
	 */
	internalClient: IC;
	/**
	 * The operations client that is used to communicate with the server.
	 */
	operations: Omit<InternalOperationsClient, 'cancelSubscriptions'>;
}
export interface AuthenticationRequestContext<User extends WunderGraphUser = WunderGraphUser> {
	/**
	 * The user that is currently logged in.
	 */
	user: User;
}

export interface WunderGraphFile {
	/**
	 * Filename of the file, as returned by the browser.
	 */
	readonly name: string;
	/**
	 * Size of the file, in bytes
	 */
	readonly size: number;
	/**
	 * File mimetype
	 */
	readonly type: string;
}

export interface PreUploadHookRequest<User extends WunderGraphUser = WunderGraphUser> {
	/**
	 * The user that is currently logged in, if any.
	 */
	user?: User;
	/**
	 * File to be uploaded
	 */
	file: WunderGraphFile;
	/**
	 * Metadata received from the client
	 */
	meta: any;
}

export interface PostUploadHookRequest<
	User extends WunderGraphUser = WunderGraphUser,
	IC extends InternalClient = InternalClient
> extends PreUploadHookRequest<User> {
	internalClient: IC;
	error: Error;
}

export interface ClientRequestHeaders extends Headers {}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';

export interface ClientRequest<H = ClientRequestHeaders> {
	method: RequestMethod;
	requestURI: string;
	/**
	 * Contains all client request headers. You can manipulate the map to add or remove headers.
	 * This might impact upstream hooks. Global hooks don't take changes into account.
	 */
	headers: H;
}

export interface WunderGraphRequest {
	method: RequestMethod;
	requestURI: string;
	headers: Headers;
	body: any;
}

export interface WunderGraphResponse extends WunderGraphRequest {
	status: string;
	statusCode: number;
}

export interface WsTransportOnConnectionInitResponse {
	payload: JSONObject;
}

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

// Changed the default type of Role to any.
// It should be worked on
export interface WunderGraphUser<Role extends string = any, CustomClaims extends {} = {}> {
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

export interface ServerRunOptions {
	wundergraphDir: string;
	serverConfig: WunderGraphHooksAndServerConfig;
	config: WunderGraphConfiguration;
	gracefulShutdown: boolean;
	clientFactory: InternalClientFactory;
}

export interface WunderGraphServerConfig<
	GeneratedHooksConfig = HooksConfiguration,
	GeneratedWebhooksConfig = WebhooksConfig
> {
	webhooks?: GeneratedWebhooksConfig;
	hooks?: GeneratedHooksConfig;
	// routeUrl is set internally
	graphqlServers?: Omit<GraphQLServerConfig, 'routeUrl'>[];
	options?: ServerOptions;
}

// internal representation of the fully resolved server config
export interface WunderGraphHooksAndServerConfig<
	GeneratedHooksConfig = HooksConfiguration,
	GeneratedWebhooksConfig = WebhooksConfig
> extends WunderGraphServerConfig<GeneratedHooksConfig, GeneratedWebhooksConfig> {
	webhooks?: GeneratedWebhooksConfig;
	hooks?: GeneratedHooksConfig;
	graphqlServers?: GraphQLServerConfig[];
	options?: ServerOptions;
}

export interface FastifyRequestBody {
	__wg: { user?: WunderGraphUser; clientRequest?: ClientRequest };
}

export interface OnConnectionInitHookRequestBody extends FastifyRequestBody {
	dataSourceId: string;
	request: WunderGraphRequest;
}

export type AuthenticationResponse<User extends WunderGraphUser> = AuthenticationOK<User> | AuthenticationDeny;

export interface AuthenticationOK<User extends WunderGraphUser> {
	status: 'ok';
	user: User;
}

export interface AuthenticationDeny {
	status: 'deny';
	message: string;
}

export interface UploadHookFileKeyResponse {
	fileKey: string;
}

export interface UploadHookErrorResponse {
	error: string;
}

export type PreUploadHookResponseData = UploadHookFileKeyResponse | UploadHookErrorResponse;
export type PreUploadHookResponse =
	| PreUploadHookResponseData
	| Promise<PreUploadHookResponseData>
	| Promise<void>
	| void;
export type PostUploadHookResponse = Promise<void> | void;

export enum HooksConfigurationOperationType {
	Queries = 'queries',
	Mutations = 'mutations',
	Subscriptions = 'subscriptions',
	Uploads = 'uploads',
}

export interface OperationHookFunction {
	(...args: any[]): Promise<any>;
}

export interface OperationHooksConfiguration<AsyncFn = OperationHookFunction> {
	mockResolve?: AsyncFn;
	preResolve?: AsyncFn;
	postResolve?: AsyncFn;
	mutatingPreResolve?: AsyncFn;
	mutatingPostResolve?: AsyncFn;
	customResolve?: AsyncFn;
}

// Any is used here because the exact type of the hooks is not known at compile time
// We could work with an index signature + base type, but that would allow to add arbitrary data to the hooks
export type OperationHooks = Record<string, any>;
export type UploadHooks = Record<string, any>;

export interface HooksConfiguration<
	Queries extends OperationHooks = OperationHooks,
	Mutations extends OperationHooks = OperationHooks,
	Subscriptions extends OperationHooks = OperationHooks,
	Uploads extends UploadHooks = UploadHooks,
	User extends WunderGraphUser = WunderGraphUser,
	// Any is used here because the exact type of the base client is not known at compile time
	// We could work with an index signature + base type, but that would allow to add arbitrary data to the client
	IC extends InternalClient = InternalClient<any, any>
> {
	global?: {
		httpTransport?: {
			onOriginRequest?: {
				hook: OperationHookFunction;
				enableForOperations?: string[];
				enableForAllOperations?: boolean;
			};
			onOriginResponse?: {
				hook: OperationHookFunction;
				enableForOperations?: string[];
				enableForAllOperations?: boolean;
			};
		};
		wsTransport?: {
			onConnectionInit?: {
				hook: OperationHookFunction;
				enableForDataSources: string[];
			};
		};
	};
	authentication?: {
		postAuthentication?: (hook: AuthenticationHookRequest<User, IC>) => Promise<void>;
		mutatingPostAuthentication?: (hook: AuthenticationHookRequest<User, IC>) => Promise<AuthenticationResponse<User>>;
		revalidate?: (hook: AuthenticationHookRequest<User, IC>) => Promise<AuthenticationResponse<User>>;
		postLogout?: (hook: AuthenticationHookRequest<User, IC>) => Promise<void>;
	};
	[HooksConfigurationOperationType.Queries]?: Queries;
	[HooksConfigurationOperationType.Mutations]?: Mutations;
	[HooksConfigurationOperationType.Subscriptions]?: Subscriptions;
	[HooksConfigurationOperationType.Uploads]?: Uploads;
}

export interface ServerOptions {
	serverUrl?: InputVariable;
	listen?: ListenOptions;
	logger?: ServerLogger;
}

export interface MandatoryServerOptions {
	serverUrl: InputVariable;
	listen: {
		host: InputVariable;
		port: InputVariable;
	};
	logger: {
		level: InputVariable<LoggerLevel>;
	};
}

export interface ResolvedServerOptions {
	serverUrl: ConfigurationVariable;
	listen: ResolvedListenOptions;
	logger: ResolvedServerLogger;
}

export interface ServerLogger {
	level?: InputVariable<LoggerLevel>;
}

export interface ResolvedServerLogger {
	level: ConfigurationVariable;
}
