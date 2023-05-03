//language=handlebars
export const template = `
import { {{ modelImports }} } from "./models"
import type { 
	BaseRequestContext,
	WunderGraphRequest,
	WunderGraphResponse,
	AuthenticationResponse,
	AuthenticationHookRequest,
	HooksConfiguration,
	WsTransportOnConnectionInitResponse,
	PreUploadHookRequest,
	PreUploadHookResponse,
	PostUploadHookRequest,
	PostUploadHookResponse,
	QueryHook,
	MutationHook,
	SubscriptionHook
} from "@wundergraph/sdk/server";
import type { InternalClient } from "./wundergraph.internal.client"
import type { User } from "./wundergraph.server"
import { InternalOperationsClient } from "./wundergraph.internal.operations.client";

export type DATA_SOURCES = {{{dataSourcesUnion}}};
        
export type JSONValue =
    | string
    | number
    | boolean
    | JSONObject
    | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };
										
export interface HookContext extends BaseRequestContext<User, InternalClient, InternalOperationsClient> {}

export type HooksConfig = HooksConfiguration<
	QueryHooks,
	MutationHooks,
	SubscriptionHooks,
	UploadHooks,
	DATA_SOURCES,
	HookContext
>;

export type QueryHooks = {
{{#if hasQueries}}
	{{#each queries}}
		{{operationName}}?: QueryHook<{{#if hasInternalInput}}Injected{{operationName}}Input{{else}}undefined{{/if}}, {{operationName}}Response, HookContext>,
	{{/each}}
{{/if}}
}

export type MutationHooks ={
{{#if hasMutations}}
	{{#each mutations}}
		{{operationName}}?: MutationHook<{{#if hasInternalInput}}Injected{{operationName}}Input{{else}}undefined{{/if}}, {{operationName}}Response, HookContext>,
	{{/each}}
{{/if}}
}

export type SubscriptionHooks = {
{{#if hasSubscriptions}}
	{{#each subscriptions}}
		{{operationName}}?: SubscriptionHook<{{#if hasInternalInput}}Injected{{operationName}}Input{{else}}undefined{{/if}}, {{operationName}}Response, HookContext>,
	{{/each}}
{{/if}}
}

export interface UploadHooks {
    {{#each uploadProviders}}
        {{name}}?: {
            {{#each uploadProfiles}}
                {{@key}}?: {
                    preUpload?: (hook: PreUploadHookRequest<User>) => PreUploadHookResponse;
                    postUpload?: (hook: PostUploadHookRequest<User, InternalClient>) => PostUploadHookResponse;
                }
            {{/each}}
        }
    {{/each}}
}
`;
