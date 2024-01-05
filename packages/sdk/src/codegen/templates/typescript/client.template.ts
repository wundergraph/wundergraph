// TODO: Remap response type due to client mismatch

//language=handlebars
export const handlebarTemplate = `
import type {
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
	UploadValidationOptions,
	QueryRequestOptions,
	MutationRequestOptions,
	ClientOperationErrors,
	ExtractProfileName,
	ExtractMeta,
	GraphQLError
} from "@wundergraph/sdk/client";
import {
	Client,
} from "@wundergraph/sdk/client";
import type { OperationErrors } from "./ts-operation-errors";

import type { PublicCustomClaims } from "./claims";
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
		hasProfiles: {{#if hasProfiles}}true{{else}}false{{/if}},
		profiles: {
			{{#each uploadProfiles}}
				{{@key}}: {{lookup (lookup @root.uploadProfileTypeNames ../name) @key}}
			{{/each}}
		}
	}
	{{/each}}
}

const S3UploadProviderData: { [provider: string]: { [profile: string]: UploadValidationOptions } } = {
	{{#each s3Providers }}
	{{name}}: {
		{{#each uploadProfiles}}
			{{@key}}: {
				requireAuthentication: {{this.requireAuthentication}},
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
    "{{operationPath}}": {
        requiresAuthentication: {{requiresAuthentication}}
		}
    {{#unless @last}},{{/unless}}
{{/each}}
}

export type PublicUser = {{#if hasPublicUserFields}}Pick<User<UserRole, PublicCustomClaims>, {{{publicUserFields}}}>{{else}}User<UserRole, PublicCustomClaims>{{/if}};

export class WunderGraphClient extends Client {
	query<
		OperationName extends Extract<keyof Operations['queries'], string>,
		Input extends Operations['queries'][OperationName]['input'] = Operations['queries'][OperationName]['input'],
    Response extends Operations['queries'][OperationName]['response'] = Operations['queries'][OperationName]['response']
	>(options: OperationName extends string ? QueryRequestOptions<OperationName, Input> : OperationRequestOptions) {
		return super.query<OperationRequestOptions, Response['data'], Response['error']>(options);
	}

	mutate<
		OperationName extends Extract<keyof Operations['mutations'], string>,
		Input extends Operations['mutations'][OperationName]['input'] = Operations['mutations'][OperationName]['input'],
    Response extends Operations['mutations'][OperationName]['response'] = Operations['mutations'][OperationName]['response']
	>(options: OperationName extends string ? MutationRequestOptions<OperationName, Input> : OperationRequestOptions) {
		return super.mutate<OperationRequestOptions, Response['data'], Response['error']>(options);
	}

	subscribe<
		OperationName extends Extract<keyof Operations["subscriptions"], string>,
		Input extends Operations["subscriptions"][OperationName]["input"] = Operations["subscriptions"][OperationName]["input"],
		Response extends Operations["subscriptions"][OperationName]["response"] = Operations["subscriptions"][OperationName]["response"],
	>(
		options: OperationName extends string
			? SubscriptionRequestOptions<OperationName, Input>
			: SubscriptionRequestOptions,
		cb?: SubscriptionEventHandler<Response["data"], Response["error"]>
	) {
		return super.subscribe<OperationRequestOptions, Response["data"], Response["error"]>(options, cb)
	}
	{{#if hasS3Providers}}
	public async uploadFiles<
		ProviderName extends Extract<keyof S3Providers, string>,
		ProfileName extends ExtractProfileName<S3Providers[ProviderName]['profiles']> = ExtractProfileName<
			S3Providers[ProviderName]['profiles']
		>,
		Meta extends ExtractMeta<S3Providers[ProviderName]['profiles'], ProfileName> = ExtractMeta<
			S3Providers[ProviderName]['profiles'],
			ProfileName
		>
	>(config: UploadRequestOptions<ProviderName, ProfileName, Meta>) {
		const profile = config.profile ? S3UploadProviderData[config.provider][config.profile as string] : undefined;
		return super.uploadFiles(config, profile);
	}
	{{/if}}
	public login(authProviderID: Operations['authProvider'], redirectURI?: string) {
		return super.login(authProviderID, redirectURI);
	}
	public async fetchUser<TUser extends PublicUser = PublicUser>(options?: FetchUserRequestOptions) {
		return super.fetchUser<TUser>(options);
	}
	public withHeaders = (headers: { [key: string]: string }) => {
		return new WunderGraphClient({
			...this.options,
			extraHeaders: headers,
		});
	};
}

export const createClient = (config?: CreateClientConfig) => {
	return new WunderGraphClient({
		...defaultClientConfig,
		...config,
		operationMetadata,
		csrfEnabled: {{csrfEnabled}},
	});
};

export type Queries = {
{{#each queries}}
    "{{operationPath}}": {
        {{#if hasInput}}input: {{inputTypename}}{{else}}input?: undefined{{/if}}
    		response: {{#if isTypeScriptOperation}}{ data?: {{responseDataTypename}}, error?: OperationErrors['{{operationPath}}'] }{{else}}{ data?: {{responseTypename}}['data'], error?: ClientOperationErrors }{{/if}}
        requiresAuthentication: {{requiresAuthentication}}
        {{#if liveQuery}}liveQuery: boolean{{/if}}
    }
{{/each}}
}

export type Mutations = {
{{#each mutations}}
    "{{operationPath}}": {
        {{#if hasInput}}input: {{inputTypename}}{{else}}input?: undefined{{/if}}
    		response: {{#if isTypeScriptOperation}}{ data?: {{responseDataTypename}}, error?: OperationErrors['{{operationPath}}'] }{{else}}{ data?: {{responseTypename}}['data'], error?: ClientOperationErrors }{{/if}}
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}

export type Subscriptions = {
{{#each subscriptions}}
    "{{operationPath}}": {
        {{#if hasInput}}input: {{inputTypename}}{{else}}input?: undefined{{/if}}
    		response: {{#if isTypeScriptOperation}}{ data?: {{responseDataTypename}}, error?: OperationErrors['{{operationPath}}'] }{{else}}{ data?: {{responseTypename}}['data'], error?: ClientOperationErrors }{{/if}}
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
{{#each liveQueries}}
    "{{operationPath}}": {
        {{#if hasInput}}input: {{inputTypename}}{{else}}input?: undefined{{/if}}
    		response: {{#if isTypeScriptOperation}}{ data?: {{responseDataTypename}}, error?: OperationErrors['{{operationPath}}'] }{{else}}{ data?: {{responseTypename}}['data'], error?: ClientOperationErrors }{{/if}}
        liveQuery: true
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}

export type LiveQueries = {
{{#each liveQueries}}
    "{{operationPath}}": {
        {{#if hasInput}}input: {{inputTypename}}{{else}}input?: undefined{{/if}}
    		response: {{#if isTypeScriptOperation}}{ data?: {{responseDataTypename}}, error?: OperationErrors['{{operationPath}}'] }{{else}}{ data?: {{responseTypename}}['data'], error?: ClientOperationErrors }{{/if}}
        liveQuery: true
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}

export interface Operations extends OperationsDefinition<Queries, Mutations, Subscriptions, LiveQueries, UserRole,{{#if hasS3Providers}}S3Providers{{else}}{}{{/if}}{{#if hasAuthProviders}},keyof typeof AuthProviderId{{/if}}> {}
`;
