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

export interface FastifyRequestContext<User = any, IC = InternalClient> {
	ctx: BaseRequestContext<User, IC> & AuthenticationRequestContext<User>;
}

export interface BaseRequestContext<User = any, IC = InternalClient> {
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

export interface AuthenticationRequestContext<User = any> {
	/**
	 * The user that is currently logged in.
	 */
	user: User;
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

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export interface WunderGraphUser<Role = any> {
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

export type AuthenticationResponse<User> = AuthenticationOK<User> | AuthenticationDeny;

export interface AuthenticationOK<User = any> {
	status: 'ok';
	user: User;
}

export interface AuthenticationDeny {
	status: 'deny';
	message: string;
}
