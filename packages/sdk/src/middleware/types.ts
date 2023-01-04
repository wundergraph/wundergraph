import { InternalClient, InternalClientFactory } from './internal-client';
import { FastifyLoggerInstance } from 'fastify';
import { Headers } from '@web-std/fetch';
import { HooksConfiguration } from '../configure';
import { GraphQLServerConfig } from './plugins/graphql';
import { WunderGraphConfiguration } from '@wundergraph/protobuf';
import { WebhooksConfig } from '../webhooks/types';
import { ServerOptions } from '../configure/options';

declare module 'fastify' {
	interface FastifyRequest extends FastifyRequestContext {}
}

export type AuthenticationHookRequest<
	User extends WunderGraphUser = WunderGraphUser,
	IC extends InternalClient = InternalClient
> = BaseRequestContext<User, IC> & AuthenticationRequestContext<User>;

export interface FastifyRequestContext<
	User extends WunderGraphUser = WunderGraphUser,
	IC extends InternalClient = InternalClient
> {
	ctx: AuthenticationHookRequest<User, IC>;
}

export interface BaseRequestContext<
	User extends WunderGraphUser = WunderGraphUser,
	IC extends InternalClient = InternalClient
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
	 */
	internalClient: IC;
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
export interface WunderGraphUser<Role extends string = any> {
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
