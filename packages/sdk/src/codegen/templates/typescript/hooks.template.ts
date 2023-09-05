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
										
export interface HookContext extends BaseRequestContext<User, InternalClient, InternalOperationsClient> {}

declare module '@wundergraph/sdk/server' {
	export interface HooksMeta {
		dataSources: {{{dataSourcesUnion}}};
		operationNames: 'Country' | 'FakeWeather' | 'PastLaunches' | 'ProtectedWeather' | 'Weather';
	}

	{{#if hasQueries}}
	export type QueryHooks = {
		{{#each queries}}
			{{operationName}}?: QueryHook{{#if hasInternalInput}}<{{injectedInputTypename}}, {{else}}WithoutInput<{{/if}}{{responseTypename}}, HookContext>,
		{{/each}}
	}
	{{/if}}

	{{#if hasMutations}}
	export type MutationHooks = {
		{{#each mutations}}
			{{operationName}}?: MutationHook<{{#if hasInternalInput}}{{injectedInputTypename}}{{else}}undefined{{/if}}, {{responseTypename}}, HookContext>,
		{{/each}}
	}
	{{/if}}

	{{#if hasSubscriptions}}
	export interface SubscriptionHooks = {
		{{#each subscriptions}}
			{{operationName}}?: SubscriptionHook<{{#if hasInternalInput}}{{injectedInputTypename}}{{else}}undefined{{/if}}, {{responseTypename}}, HookContext>,
		{{/each}}
	}
	{{/if}}

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
}
`;
