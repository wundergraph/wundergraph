//language=handlebars
export const handlebarTemplate = `
import {
	Client,
	ClientConfig,
	CreateClientConfig,
	User,
	UploadRequestOptions,
	OperationMetadata,
	OperationsDefinition,
	OperationRequestOptions,
	SubscriptionRequestOptions,
	SubscriptionEventHandler,
	FetchUserRequestOptions,
} from "@wundergraph/sdk/client";
import type { {{ modelImports }} } from "./models";

export type UserRole = {{{ roleDefinitions }}};

export const WUNDERGRAPH_S3_ENABLED = {{hasS3Providers}};
export const WUNDERGRAPH_AUTH_ENABLED = {{hasAuthProviders}};

{{#if hasS3Providers}}
export interface UploadResponse { key: string }

{{#each uploadProfileTypeDefinitions}}

{{.}}

{{/each}}

type S3Providers ={
	{{#each s3Providers}}
	{{name}}: {
		{{#each uploadProfiles}}
			{{@key}}: {{lookup (lookup @root.uploadProfileTypeNames ../name) @key}}
		{{/each}}
	}
	{{/each}}
}

const S3UploadProviderData = {
	{{#each s3Providers }}
	{{name}}: {
		{{#each uploadProfiles}}
			{{@key}}: {
				{{#if this.maxAllowedUploadSizeBytes includeZero=true}}
				maxAllowedUploadSizeBytes: {{this.maxAllowedUploadSizeBytes}},
				{{/if}}
				{{#if this.maxAllowedFiles includeZero=true}}
				maxAllowedFiles: {{this.maxAllowedFiles}},
				{{/if}}
				{{#if this.allowedMimeTypes}}
				allowedMimeTypes: [{{#each this.allowedMimeTypes}}'{{this}}',{{/each}}],
				{{/if}}
				{{#if this.allowedFileExtensions}}
				allowedFileExtensions: [{{#each this.allowedFileExtensions}}'{{this}}',{{/each}}],
				{{/if}}
			},
		{{/each}}
	},
	{{/each}}
}
{{/if}}

{{#if hasAuthProviders}}
export enum AuthProviderId {
    {{#each authProviders}}
    "{{.}}" = "{{.}}",
    {{/each}}
}

export interface AuthProvider {
    id: AuthProviderId;
    login: (redirectURI?: string) => void;
}
{{/if}}

export const defaultClientConfig: ClientConfig = {
    applicationHash: "{{applicationHash}}",
    baseURL: "{{baseURL}}",
    sdkVersion: "{{sdkVersion}}",
}

export const operationMetadata: OperationMetadata = {
{{#each allOperations}}
    {{operationName}}: {
        requiresAuthentication: {{requiresAuthentication}}
		}
    {{#unless @last}},{{/unless}}
{{/each}}
}

export class WunderGraphClient extends Client {
	query<
		OperationName extends Extract<keyof Operations['queries'], string>,
		Input extends Operations['queries'][OperationName]['input'] = Operations['queries'][OperationName]['input'],
		Data extends Operations['queries'][OperationName]['data'] = Operations['queries'][OperationName]['data']
	>(options: OperationName extends string ? OperationRequestOptions<OperationName, Input> : OperationRequestOptions) {
		return super.query<OperationRequestOptions, Data>(options);
	}
	mutate<
		OperationName extends Extract<keyof Operations['mutations'], string>,
		Input extends Operations['mutations'][OperationName]['input'] = Operations['mutations'][OperationName]['input'],
		Data extends Operations['mutations'][OperationName]['data'] = Operations['mutations'][OperationName]['data']
	>(options: OperationName extends string ? OperationRequestOptions<OperationName, Input> : OperationRequestOptions) {
		return super.mutate<OperationRequestOptions, Data>(options);
	}
	subscribe<
		OperationName extends Extract<keyof Operations['subscriptions'], string>,
		Input extends Operations['subscriptions'][OperationName]['input'] = Operations['subscriptions'][OperationName]['input'],
		Data extends Operations['subscriptions'][OperationName]['data'] = Operations['subscriptions'][OperationName]['data']
	>(
		options: OperationName extends string
			? SubscriptionRequestOptions<OperationName, Input>
			: SubscriptionRequestOptions,
		cb: SubscriptionEventHandler<Data>
	) {
		return super.subscribe(options, cb);
	}
	{{#if hasS3Providers}}
	public async uploadFiles<
		ProviderName extends Extract<keyof S3Providers, string>,
		ProfileName extends Extract<keyof S3Providers[ProviderName], string> = Extract<
			keyof S3Providers[ProviderName],
			string
		>,
		Meta extends Extract<S3Providers[ProviderName][ProfileName], object> = Extract<
			S3Providers[ProviderName][ProfileName],
			object
		>
	>(
		config: ProviderName extends string ? UploadRequestOptions<ProviderName, ProfileName, Meta> : UploadRequestOptions
	) {
		const profile = config.profile ? S3UploadProviderData[config.provider][config.profile as string] : undefined;
		return super.uploadFiles(config, profile);
	}
	{{/if}}
	public login(authProviderID: Operations['authProvider'], redirectURI?: string) {
		return super.login(authProviderID, redirectURI);
	}
	public async fetchUser<TUser extends User = User<UserRole>>(options?: FetchUserRequestOptions) {
		return super.fetchUser<TUser>(options);
	}
}

export const createClient = (config?: CreateClientConfig) => {
	return new WunderGraphClient({
		...defaultClientConfig,
		...config,
		operationMetadata,
	});
};

export type Queries = {
{{#each queries}}
    {{operationName}}: {
        {{#if hasInput}}input: {{operationName}}Input{{else}}input?: undefined{{/if}}
        data: {{operationName}}ResponseData
        requiresAuthentication: {{requiresAuthentication}}
        {{#if liveQuery}}liveQuery: boolean{{/if}}
    }
{{/each}}
}

export type Mutations = {
{{#each mutations}}
    {{operationName}}: {
        {{#if hasInput}}input: {{operationName}}Input{{else}}input?: undefined{{/if}}
        data: {{operationName}}ResponseData
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}

export type Subscriptions = {
{{#each subscriptions}}
    {{operationName}}: {
        {{#if hasInput}}input: {{operationName}}Input{{else}}input?: undefined{{/if}}
        data: {{operationName}}ResponseData
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}

export type LiveQueries = {
{{#each liveQueries}}
    {{operationName}}: {
        {{#if hasInput}}input: {{operationName}}Input{{else}}input?: undefined{{/if}}
        data: {{operationName}}ResponseData
        liveQuery: true
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}

export interface Operations extends OperationsDefinition<Queries, Mutations, Subscriptions, UserRole,{{#if hasS3Providers}}S3Providers{{else}}{}{{/if}}{{#if hasAuthProviders}},keyof typeof AuthProviderId{{/if}}> {}
`;
