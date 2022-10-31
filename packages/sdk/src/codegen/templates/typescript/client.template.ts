//language=handlebars
export const handlebarTemplate = `
import { Client, ClientConfig, User, UploadRequestOptions, OperationMetadata, OperationsDefinition } from '@wundergraph/sdk/client';
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

export const createClient = (config?: Omit<ClientConfig, PrivateConfigProperties>) => {
    return new Client({
        ...defaultClientConfig,
        ...config,
    		operationMetadata
    })
}

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

export interface Operations extends OperationsDefinition<Queries, Mutations, Subscriptions, UserRole{{#if hasS3Provider}}, keyof typeof S3Provider{{/if}}{{#if hasAuthProviders}},keyof typeof AuthProviderId{{/if}}> {}
`;
