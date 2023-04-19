//language=handlebars
export const template = `
import type { HooksConfig } from "./wundergraph.hooks";
import type { WebhooksConfig } from "./wundergraph.webhooks";
import type { InternalClient } from "./wundergraph.internal.client"
import type { InternalOperationsClient } from "./wundergraph.internal.operations.client";
import type { CustomClaims } from "./claims";
import type { GraphQLServerConfig, BaseRequestContext, WunderGraphUser, WunderGraphServerConfig, WunderGraphHooksAndServerConfig } from "@wundergraph/sdk/server";

export type Role = {{{ roleDefinitions }}};

export interface User extends WunderGraphUser<Role, CustomClaims> {}

export interface Config {
    hooks: HooksConfig;
    graphqlServers?: Omit<GraphQLServerConfig, 'routeUrl'>[];
}

export interface OutputConfig {
    hooks: HooksConfig;
    graphqlServers?: (GraphQLServerConfig & { url: string })[];
}

export interface GraphQLExecutionContext {
    wundergraph: BaseRequestContext<User, InternalClient, InternalOperationsClient>;
}

declare module "@wundergraph/sdk/server" {
    export function configureWunderGraphServer<GeneratedHooksConfig = HooksConfig, GeneratedInternalClient = InternalClient, GeneratedWebhooksConfig = WebhooksConfig>(configWrapper: () => WunderGraphServerConfig<GeneratedHooksConfig, GeneratedWebhooksConfig>) : WunderGraphHooksAndServerConfig
}

`;
