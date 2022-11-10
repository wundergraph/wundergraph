//language=handlebars
export const handlebarTemplate = `
import {
	Client,
	ClientConfig,
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

export const WUNDERGRAPH_S3_ENABLED = {{hasS3Provider}};
export const WUNDERGRAPH_AUTH_ENABLED = {{hasAuthProviders}};

{{#if hasS3Provider}}
export interface UploadResponse { key: string }

export enum S3Provider {
    {{#each s3Provider }}
    "{{name}}" = "{{name}}",
    {{/each}}
}

export type UploadConfig = UploadRequestOptions<S3Provider>
{{else}}
export type UploadConfig = UploadRequestOptions<never>
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
    applicationPath: "{{applicationPath}}",
    baseURL: "{{baseURL}}",
    sdkVersion: "{{sdkVersion}}",
}

const operationMetadata: OperationMetadata = {
{{#each allOperations}}
    {{operationName}}: {
        requiresAuthentication: {{requiresAuthentication}}
		}
    {{#unless @last}},{{/unless}}
{{/each}}
}

type PrivateConfigProperties = 'applicationHash' | 'applicationPath' | 'sdkVersion' | 'operationMetadata'

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
	public async uploadFiles(config: UploadConfig) {
		return super.uploadFiles(config);
	}
	public login(authProviderID: Operations['authProvider'], redirectURI?: string) {
		return super.login(authProviderID, redirectURI);
	}
	public async fetchUser<TUser extends User = User<UserRole>>(options: FetchUserRequestOptions) {
		return super.fetchUser<TUser>(options);
	}
}

export const createClient = (config?: Partial<Omit<ClientConfig, PrivateConfigProperties>>) => {
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
        liveQuery: {{liveQuery}}
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

export interface Operations extends OperationsDefinition<Queries, Mutations, Subscriptions, UserRole{{#if hasS3Provider}}, keyof typeof S3Provider{{/if}}{{#if hasAuthProviders}},keyof typeof AuthProviderId{{/if}}> {}
`;
