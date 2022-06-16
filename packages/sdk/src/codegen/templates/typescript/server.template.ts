//language=handlebars
export const template = `
import type { HooksConfig, JSONObject } from "./wundergraph.hooks";
import type { InternalClient } from "./wundergraph.internal.client"
import type { GraphQLServerConfig, Context, FastifyLoggerInstance } from "@wundergraph/sdk";

export type Role = {{{ roleDefinitions }}};

export interface User {
    provider?: string;
    provider_id?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    first_name?: string;
    last_name?: string;
    nick_name?: string;
    description?: string;
    user_id?: string;
    avatar_url?: string;
    location?: string;
    roles?: Role[];
    custom_attributes?: string[];
    custom_claims?: {
        [key: string]: any;
    };
    access_token?: JSONObject;
    id_token?: JSONObject;
    raw_id_token?: string;
}

export interface Config {
    hooks: HooksConfig;
    graphqlServers?: Omit<GraphQLServerConfig, 'routeUrl'>[];
}

export interface OutputConfig {
    hooks: HooksConfig;
    graphqlServers?: (GraphQLServerConfig & { url: string })[];
}

export interface GraphQLExecutionContext {
    wgContext: Context<User, InternalClient>;
}
`;
