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
import { InternalOperations } from "./wundergraph.internal.operations.client";

export type DATA_SOURCES = {{{dataSourcesUnion}}};
										
declare module '@wundergraph/sdk/server' {
	export interface HooksMeta {
		dataSources: {{{dataSourcesUnion}}};
		operationNames: 'Country' | 'FakeWeather' | 'PastLaunches' | 'ProtectedWeather' | 'Weather';
		operations: InternalOperations;
		user: User;
	}

	{{#if hasQueries}}
	export interface QueryHooks {
		{{#each queries}}
			{{operationName}}?: QueryHook{{#if hasInternalInput}}<{{injectedInputTypename}}, {{else}}WithoutInput<{{/if}}{{responseTypename}}>
		{{/each}}
	}
	{{/if}}

	{{#if hasMutations}}
	export interface MutationHooks {
		{{#each mutations}}
			{{operationName}}?: MutationHook<{{#if hasInternalInput}}{{injectedInputTypename}}{{else}}undefined{{/if}}, {{responseTypename}}>
		{{/each}}
	}
	{{/if}}

	{{#if hasSubscriptions}}
	export interface SubscriptionHooks = {
		{{#each subscriptions}}
			{{operationName}}?: SubscriptionHook<{{#if hasInternalInput}}{{injectedInputTypename}}{{else}}undefined{{/if}}, {{responseTypename}}>
		{{/each}}
	}
	{{/if}}

	export interface UploadHooks {
		{{#each uploadProviders}}
			{{name}}?: {
				{{#each uploadProfiles}}
					{{@key}}?: {
						preUpload?: (hook: PreUploadHookRequest<User>) => PreUploadHookResponse;
						postUpload?: (hook: PostUploadHookRequest<User>) => PostUploadHookResponse;
					}
				{{/each}}
			}
		{{/each}}
	}
}
`;
