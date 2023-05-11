//language=handlebars
export const template = `
import type { HooksConfig } from "./wundergraph.hooks";
import type { WebhooksConfig } from "./wundergraph.webhooks";
import type { InternalClient } from "./wundergraph.internal.client"
import type { InternalOperationsClient } from "./wundergraph.internal.operations.client";
import type { CustomClaims } from "./claims";
import type {
	BaseRequestContext,
	InternalCreateRequestContextData,
	GraphQLServerConfig,
	WunderGraphUser,
	WunderGraphServerConfig,
	WunderGraphHooksAndServerConfig
} from "@wundergraph/sdk/server";

export type Role = {{{ roleDefinitions }}};

export interface User extends WunderGraphUser<Role, CustomClaims> {}

export interface CreateRequestContextData extends InternalCreateRequestContextData<User, InternalClient, InternalOperationsClient> {}

export interface Config<TCustomContext> {
    hooks: HooksConfig<TCustomContext>;
    graphqlServers?: Omit<GraphQLServerConfig, 'routeUrl'>[];
}

export interface OutputConfig<TCustomContext> {
    hooks: HooksConfig<TCustomContext>;
    graphqlServers?: (GraphQLServerConfig & { url: string })[];
}

export interface GraphQLExecutionContext<TCustomContext = any> {
    wundergraph: BaseRequestContext<User, InternalClient, InternalOperationsClient, TCustomContext>;
}

declare module "@wundergraph/sdk/server" {
	export function configureWunderGraphServer<TRequestContext = any, TGlobalContext = any>(
		configWrapper: () => WunderGraphServerConfig<
			HooksConfig<TRequestContext>,
			WebhooksConfig,
			TGlobalContext,
			TRequestContext,
			CreateRequestContextData
		>
	): WunderGraphHooksAndServerConfig<any, any, TGlobalContext, TRequestContext, CreateRequestContextData>;
}
`;
