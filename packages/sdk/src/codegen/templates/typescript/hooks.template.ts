//language=handlebars
export const template = `
import { {{ modelImports }} } from "./models"
import type { 
	BaseRequestContext,
	HooksConfiguration,
	PreUploadHookRequest,
	PreUploadHookResponse,
	PostUploadHookRequest,
	PostUploadHookResponse,
	QueryHook,
	QueryHookWithoutInput,
	MutationHook,
	MutationHookWithoutInput,
	SubscriptionHook,
	SubscriptionHookWithoutInput,
} from "@wundergraph/sdk/server";
import type { InternalClient } from "./wundergraph.internal.client"
import type { User } from "./wundergraph.server"
import { InternalOperationsClient } from "./wundergraph.internal.operations.client";

export type DATA_SOURCES = {{{dataSourcesUnion}}};
										
export interface HookContext<TCustomContext> extends BaseRequestContext<User, InternalClient, InternalOperationsClient, TCustomContext> {}

export type HooksConfig<TCustomContext> = HooksConfiguration<
	QueryHooks<TCustomContext>,
	MutationHooks<TCustomContext>,
	SubscriptionHooks<TCustomContext>,
	UploadHooks<TCustomContext>,
	DATA_SOURCES,
	HookContext<TCustomContext>
>;

export type QueryHooks<TCustomContext> = {
{{#if hasQueries}}
	{{#each queries}}
		{{operationName}}?: QueryHook{{#if hasInternalInput}}<{{injectedInputTypename}}, {{else}}WithoutInput<{{/if}}{{responseTypename}}, HookContext<TCustomContext>>,
	{{/each}}
{{/if}}
}

export type MutationHooks<TCustomContext> ={
{{#if hasMutations}}
	{{#each mutations}}
		{{operationName}}?: MutationHook<{{#if hasInternalInput}}{{injectedInputTypename}}{{else}}undefined{{/if}}, {{responseTypename}}, HookContext<TCustomContext>>,
	{{/each}}
{{/if}}
}

export type SubscriptionHooks<TCustomContext> = {
{{#if hasSubscriptions}}
	{{#each subscriptions}}
		{{operationName}}?: SubscriptionHook<{{#if hasInternalInput}}{{injectedInputTypename}}{{else}}undefined{{/if}}, {{responseTypename}}, HookContext<TCustomContext>>,
	{{/each}}
{{/if}}
}

export interface UploadHooks<TCustomContext> {
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
