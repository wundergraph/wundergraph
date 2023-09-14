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
import type { User } from "./wundergraph.server"
import { InternalOperationsClient } from "./wundergraph.internal.operations.client";

export type DATA_SOURCES = {{{dataSourcesUnion}}};
										
export interface HookContext<TCustomContext = any> extends BaseRequestContext<User, InternalOperationsClient, TCustomContext> {}

export type HooksConfig<TCustomContext = any> = HooksConfiguration<
	QueryHooks<TCustomContext>,
	MutationHooks<TCustomContext>,
	SubscriptionHooks<TCustomContext>,
	UploadHooks<TCustomContext>,
	DATA_SOURCES,
	HookContext<TCustomContext>
>;

export type QueryHooks<TCustomContext = any> = {
{{#if hasQueries}}
	{{#each queries}}
		{{operationName}}?: QueryHook{{#if hasInternalInput}}<{{injectedInputTypename}}, {{else}}WithoutInput<{{/if}}{{responseTypename}}, HookContext<TCustomContext>>,
	{{/each}}
{{/if}}
}

export type MutationHooks<TCustomContext = any> = {
{{#if hasMutations}}
	{{#each mutations}}
		{{operationName}}?: MutationHook<{{#if hasInternalInput}}{{injectedInputTypename}}{{else}}undefined{{/if}}, {{responseTypename}}, HookContext<TCustomContext>>,
	{{/each}}
{{/if}}
}

export type SubscriptionHooks<TCustomContext = any> = {
{{#if hasSubscriptions}}
	{{#each subscriptions}}
		{{operationName}}?: SubscriptionHook<{{#if hasInternalInput}}{{injectedInputTypename}}{{else}}undefined{{/if}}, {{responseTypename}}, HookContext<TCustomContext>>,
	{{/each}}
{{/if}}
}

export interface UploadHooks<TCustomContext = any> {
    {{#each uploadProviders}}
        {{name}}?: {
            {{#each uploadProfiles}}
                {{@key}}?: {
                    preUpload?: (hook: PreUploadHookRequest<User, TCustomContext>) => PreUploadHookResponse;
                    postUpload?: (hook: PostUploadHookRequest<User, TCustomContext>) => PostUploadHookResponse;
                }
            {{/each}}
        }
    {{/each}}
}
`;
