import type { InternalClient, InternalClientFactory } from './internal-client';
import type { Headers } from '@whatwg-node/fetch';
import type { GraphQLServerConfig } from './plugins/graphql';
import type { ConfigurationVariable, WunderGraphConfiguration } from '@wundergraph/protobuf';
import type { WebhooksConfig } from '../webhooks/types';
import type { InputVariable } from '../configure/variables';
import type { ListenOptions, LoggerLevel, ResolvedListenOptions } from '../configure/options';
import { OperationsClient } from './operations-client';
import { GraphQLError } from '../client';
import { TelemetryOptions } from './trace/trace';
import { RequestLogger } from './logger';

declare module 'fastify' {
	interface FastifyRequest extends FastifyRequestContext {}
}

export interface FastifyRequestBody {
	__wg: { user?: WunderGraphUser; clientRequest?: ClientRequest };
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

export type AuthenticationHookRequest<Context extends BaseRequestContext = BaseRequestContext> = Context &
	(Context extends BaseRequestContext<infer User> ? AuthenticationRequestContext<User> : never);

export interface FastifyRequestContext<
	User extends WunderGraphUser = WunderGraphUser,
	IC extends InternalClient = InternalClient,
	InternalOperationsClient extends OperationsClient = OperationsClient,
	TRequestContext = any
> {
	ctx: AuthenticationHookRequest<BaseRequestContext<User, IC, InternalOperationsClient, TRequestContext>>;
}
export interface BaseRequestContext<
	User extends WunderGraphUser = WunderGraphUser,
	IC extends InternalClient = InternalClient,
	InternalOperationsClient extends OperationsClient = OperationsClient,
	TCustomContext = any
> {
	/**
	 * The user that is currently logged in.
	 */
	user?: User;

	clientRequest: ClientRequest;
	/**
	 * The request logger.
	 */
	log: RequestLogger;
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
	/**
	 * Custom context
	 */
	context: TCustomContext;
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

export interface PreUploadHookRequest<User extends WunderGraphUser = WunderGraphUser, TCustomContext = any> {
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
	/**
	 * Custom handler context
	 */
	context: TCustomContext;
}

export interface PostUploadHookRequest<
	User extends WunderGraphUser = WunderGraphUser,
	IC extends InternalClient = InternalClient,
	TCustomContext = any
> extends PreUploadHookRequest<User, TCustomContext> {
	internalClient: IC;
	error: Error;
}

export interface ClientRequestHeaders extends Headers {}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';

export interface ClientRequest {
	method: RequestMethod;
	requestURI: string;
	/**
	 * Contains all client request headers. You can manipulate the map to add or remove headers.
	 * This might impact upstream hooks. Global hooks don't take changes into account.
	 */
	headers: ClientRequestHeaders;
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
	/**
	 * expires indicates the Unix timestamp in milliseconds when the user expires. After that,
	 * if needs to be revalidated (via the revalidate hook) in order to take effect. If expires
	 * is <= 0 or undefined, the session lasts forever.
	 *
	 * @default undefined
	 */
	expires?: number;
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

export interface TracerConfig extends TelemetryOptions {
	enabled: boolean;
}

export interface ServerRunOptions {
	wundergraphDir: string;
	serverConfig: WunderGraphHooksAndServerConfig<any, any, any, any>;
	config: WunderGraphConfiguration;
	gracefulShutdown: boolean;
	clientFactory: InternalClientFactory;
}

export interface CreateServerOptions extends ServerRunOptions {
	serverHost: string;
	serverPort: number;
}

/***
 * WunderGraphServerContext encapsulates the available functions for
 * creating and release global and per request custom contexts.
 */
export interface WunderGraphServerContext<TRequestContext = any, TGlobalContext = any> {
	global?: {
		/**
		 * Create is called once during server startup and the returned
		 * value is passed to all per-request context creation calls as
		 * well as the global context release.
		 *
		 * @returns The global context
		 */
		create?: () => Promise<TGlobalContext>;
		/**
		 * Release was called once during server shutdown, givin the global
		 * context a chance to release its resources.
		 *
		 * @param ctx Global context returned by create
		 */
		release?: (ctx: TGlobalContext) => Promise<void>;
	};
	request?: {
		/**
		 * Create is called once per request, returning the per-request context
		 * accessible to hooks, functions, webhooks and other handlers.
		 *
		 * @param ctx Global context returned by global.create
		 * @returns The per-request context
		 */
		create?: (ctx: TGlobalContext) => Promise<TRequestContext>;
		/**
		 * Release is called once after the request ends, allowing the per-request
		 * context to release any pending resources.
		 *
		 * @param ctx Per-request context returned by create
		 */
		release?: (ctx: TRequestContext) => Promise<void>;
	};
}

export interface WunderGraphServerConfig<
	GeneratedHooksConfig = HooksConfiguration,
	GeneratedWebhooksConfig = WebhooksConfig,
	TRequestContext = any,
	TGlobalContext = any
> {
	webhooks?: GeneratedWebhooksConfig;
	hooks?: GeneratedHooksConfig;
	// routeUrl is set internally
	graphqlServers?: Omit<GraphQLServerConfig, 'routeUrl'>[];
	options?: ServerOptions;
	/**
	 * Context creation/release
	 */
	context?: WunderGraphServerContext<TRequestContext, TGlobalContext>;
}

// internal representation of the fully resolved server config
export interface WunderGraphHooksAndServerConfig<
	GeneratedHooksConfig = HooksConfiguration,
	GeneratedWebhooksConfig = WebhooksConfig,
	TRequestContext = any,
	TGlobalContext = any
> extends WunderGraphServerConfig<GeneratedHooksConfig, GeneratedWebhooksConfig, TRequestContext, TGlobalContext> {
	webhooks?: GeneratedWebhooksConfig;
	hooks?: GeneratedHooksConfig;
	graphqlServers?: GraphQLServerConfig[];
	options?: ServerOptions;
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

export type SKIP = 'skip';

// use CANCEL to skip the hook and cancel the request / response chain
// this is semantically equal to throwing an error (500)
export type CANCEL = 'cancel';

export type HttpTransportHookRequest<Operations = string, Context extends BaseRequestContext = BaseRequestContext> = {
	request: WunderGraphRequest;
	operation: {
		name: Operations;
		type: 'mutation' | 'query' | 'subscription';
	};
} & Context;

export type HttpTransportHookRequestWithResponse<
	Operations = string,
	Context extends BaseRequestContext = BaseRequestContext
> = {
	response: WunderGraphResponse;
	operation: {
		name: Operations;
		type: string;
	};
} & Context;

export type WsTransportHookRequest<
	DataSources extends string = string,
	Context extends BaseRequestContext = BaseRequestContext
> = {
	dataSourceId: DataSources;
	request: WunderGraphRequest;
} & Context;

export type HttpTransportRequest<Operations = string, Context extends BaseRequestContext = BaseRequestContext> = {
	request: Request;
	operation: {
		name: Operations;
		type: 'mutation' | 'query' | 'subscription';
	};
} & Context;

// Any is used here because the exact type of the hooks is not known at compile time
// We could work with an index signature + base type, but that would allow to add arbitrary data to the hooks
export type OperationHooks = Record<string, any>;
export type UploadHooks = Record<string, any>;

type HookResponse = {
	data?: any;
	errors?: GraphQLError[];
};

type WithInput<Input = unknown, Context extends BaseRequestContext = BaseRequestContext> = Context &
	(Input extends undefined ? {} : { input: Input });

export type QueryHook<
	Input = unknown,
	Response extends HookResponse = HookResponse,
	Context extends BaseRequestContext = BaseRequestContext
> = {
	mockResolve?: (hook: WithInput<Input, Context>) => Promise<Response>;
	preResolve?: (hook: WithInput<Input, Context>) => Promise<void>;
	mutatingPreResolve?: Input extends undefined ? never : (hook: Context & { input: Input }) => Promise<Input>;
	postResolve?: (hook: WithInput<Input, Context> & { response: Response }) => Promise<void>;
	customResolve?: (hook: WithInput<Input, Context>) => Promise<void | unknown | null>;
	mutatingPostResolve?: (hook: WithInput<Input, Context> & { response: Response }) => Promise<Response>;
};

export type QueryHookWithoutInput<
	Response extends HookResponse = HookResponse,
	Context extends BaseRequestContext = BaseRequestContext
> = Omit<QueryHook<undefined, Response, Context>, 'mutatingPreResolve'>;

export type MutationHook<
	Input = unknown,
	Response extends HookResponse = HookResponse,
	Context extends BaseRequestContext = BaseRequestContext
> = {
	mockResolve?: (hook: WithInput<Input, Context>) => Promise<Response>;
	preResolve?: (hook: WithInput<Input, Context>) => Promise<void>;
	mutatingPreResolve?: Input extends undefined ? never : (hook: Context & { input: Input }) => Promise<Input>;
	postResolve?: (hook: WithInput<Input, Context> & { response: Response }) => Promise<void>;
	customResolve?: (hook: WithInput<Input, Context>) => Promise<void | Response | null>;
	mutatingPostResolve?: (hook: WithInput<Input, Context> & { response: Response }) => Promise<Response>;
};

export type MutationHookWithoutInput<
	Response extends HookResponse = HookResponse,
	Context extends BaseRequestContext = BaseRequestContext
> = Omit<QueryHook<undefined, Response, Context>, 'mutatingPreResolve'>;

export type SubscriptionHook<
	Input = unknown,
	Response extends HookResponse = HookResponse,
	Context extends BaseRequestContext = BaseRequestContext
> = {
	preResolve?: (hook: WithInput<Input, Context>) => Promise<void>;
	mutatingPreResolve?: Input extends undefined ? never : (hook: Context & { input: Input }) => Promise<Input>;
	postResolve?: (hook: WithInput<Input, Context> & { response: Response }) => Promise<void>;
	mutatingPostResolve?: (hook: WithInput<Input, Context> & { response: Response }) => Promise<Response>;
};

export type SubscriptionHookWithoutInput<
	Response extends HookResponse = HookResponse,
	Context extends BaseRequestContext = BaseRequestContext
> = Omit<QueryHook<undefined, Response, Context>, 'mutatingPreResolve'>;

export interface QueryHooks<Context extends BaseRequestContext = BaseRequestContext> {
	[operationName: string]: QueryHook<any, any, Context> | QueryHookWithoutInput<any, any>;
}

export interface MutationHooks<Context extends BaseRequestContext = BaseRequestContext> {
	[operationName: string]: MutationHook<any, any, Context> | MutationHookWithoutInput<any, any>;
}

export interface SubscriptionHooks<Context extends BaseRequestContext = BaseRequestContext> {
	[operationName: string]: SubscriptionHook<any, any, Context> | SubscriptionHookWithoutInput<any, any>;
}

export interface GlobalHooksConfig<
	Operations = string,
	DataSources extends string = string,
	Context extends BaseRequestContext = BaseRequestContext
> {
	httpTransport?: {
		// onRequest is called right before the request is sent to the origin
		// it can be used to modify the request
		// you can return SKIP to skip the hook and continue the request chain without modifying the request
		// you can return CANCEL to cancel the request chain and return a 500 error
		onOriginRequest?: {
			hook: (hook: HttpTransportHookRequest<Operations, Context>) => Promise<WunderGraphRequest | SKIP | CANCEL>;
			// calling the httpTransport hooks has a case, because the custom httpTransport hooks have to be called for each request
			// for this reason, you have to explicitly enable the hook for each Operation
			enableForOperations?: Operations[];
			// enableForAllOperations will disregard the enableForOperations property and enable the hook for all operations
			enableForAllOperations?: boolean;
		};
		// onResponse is called right after the response is received from the origin
		// it can be used to modify the response
		// you can return SKIP to skip the hook and continue the response chain without modifying the response
		// you can return CANCEL to cancel the response chain and return a 500 error
		onOriginResponse?: {
			hook: (
				hook: HttpTransportHookRequestWithResponse<Operations, Context>
			) => Promise<WunderGraphResponse | SKIP | CANCEL>;
			// calling the httpTransport hooks has a case, because the custom httpTransport hooks have to be called for each request
			// for this reason, you have to explicitly enable the hook for each Operation
			enableForOperations?: Operations[];
			// enableForAllOperations will disregard the enableForOperations property and enable the hook for all operations
			enableForAllOperations?: boolean;
		};
		onOriginTransport?: {
			hook: (hook: HttpTransportRequest<Operations, Context>) => Promise<Response | null | undefined>;
		};
	};
	wsTransport?: {
		// onConnectionInit is used to populate 'connection_init' message payload with custom data
		// it can be used to authenticate the websocket connection
		onConnectionInit?: {
			hook: (hook: WsTransportHookRequest<DataSources, Context>) => Promise<WsTransportOnConnectionInitResponse>;
			/**
			 * enableForDataSources will enable the hook for specific data sources.
			 * you should provide a list of data sources ids
			 * an id is the identifier of the data source in the wundergraph.config.ts file
			 * @example
			 *const chat = introspect.graphql({
			 *	id: 'chatId',
			 *	apiNamespace: 'chat',
			 *	url: 'http://localhost:8085/query',
			 *});
			 */
			enableForDataSources: DataSources[];
		};
	};
}

type AuthenticationHooks<Context extends BaseRequestContext = BaseRequestContext> = Context extends BaseRequestContext<
	infer User
>
	? {
			postAuthentication?: (hook: AuthenticationHookRequest<Context>) => Promise<void>;
			mutatingPostAuthentication?: (hook: AuthenticationHookRequest<Context>) => Promise<AuthenticationResponse<User>>;
			revalidate?: (hook: AuthenticationHookRequest<Context>) => Promise<AuthenticationResponse<User>>;
			postLogout?: (hook: AuthenticationHookRequest<Context>) => Promise<void>;
	  }
	: never;

type OperationNames<Queries, Mutations, Subscriptions> =
	| Extract<keyof Queries, string>
	| Extract<keyof Mutations, string>
	| Extract<keyof Subscriptions, string>;

export interface HooksConfiguration<
	Queries extends QueryHooks<Context> = QueryHooks,
	Mutations extends MutationHooks<Context> = MutationHooks,
	Subscriptions extends SubscriptionHooks<Context> = SubscriptionHooks,
	Uploads extends UploadHooks = UploadHooks,
	DataSources extends string = string,
	Context extends BaseRequestContext = BaseRequestContext
> {
	global?: GlobalHooksConfig<OperationNames<Queries, Mutations, Subscriptions>, DataSources, Context>;
	authentication?: AuthenticationHooks<Context>;
	[HooksConfigurationOperationType.Queries]?: Queries;
	[HooksConfigurationOperationType.Mutations]?: Mutations;
	[HooksConfigurationOperationType.Subscriptions]?: Subscriptions;
	[HooksConfigurationOperationType.Uploads]?: Uploads;
}
