//language=handlebars
export const template = `
import type { HooksConfig } from "./wundergraph.hooks";
import type { WebhooksConfig } from "./wundergraph.webhooks";
import type { InternalOperationsClient } from "./wundergraph.internal.operations.client";
import type { CustomClaims } from "./claims";
import type {
	BaseRequestContext,
	CustomContext,
	GraphQLServerConfig,
	WunderGraphUser,
	WunderGraphServerConfig,
	WunderGraphHooksAndServerConfig
} from "@wundergraph/sdk/server";

export type Role = {{{ roleDefinitions }}};

export interface User extends WunderGraphUser<Role, CustomClaims> {}

export interface Config<TCustomContext> {
    hooks: HooksConfig<TCustomContext>;
    graphqlServers?: Omit<GraphQLServerConfig, 'routeUrl'>[];
}

export interface OutputConfig<TCustomContext> {
    hooks: HooksConfig<TCustomContext>;
    graphqlServers?: (GraphQLServerConfig & { url: string })[];
}

export interface GraphQLExecutionContext<TCustomContext = any> {
    wundergraph: BaseRequestContext<User, InternalOperationsClient, TCustomContext>;
}

type RequestContext = CustomContext extends { request: infer R } ? R : any;
type GlobalContext = CustomContext extends { global: infer G } ? G : any;

declare module "@wundergraph/sdk/server" {
	export function configureWunderGraphServer(
		configWrapper: () => WunderGraphServerConfig<
			HooksConfig<RequestContext>,
			WebhooksConfig,
			RequestContext,
			GlobalContext
		>
	): WunderGraphHooksAndServerConfig<any, any, RequestContext, GlobalContext>;
}
`;
