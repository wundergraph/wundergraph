//language=handlebars
export const handlebarTemplate = `
import { WunderGraphClient, ClientConfig, ClientOperations, ClientOperationDefs } from '@wundergraph/sdk/client'
import type { {{ modelImports }} } from "./models";

export type Role = {{{ roleDefinitions }}};

export const defaultClientConfig: ClientConfig = {
    applicationHash: "{{applicationHash}}",
    applicationPath: "{{applicationPath}}",
    baseURL: "{{baseURL}}",
    sdkVersion: "{{sdkVersion}}",
}

export interface CreateClientProps {
    baseURL?: string;
}

export const createClient = (config?: CreateClientProps) => {
    return new WunderGraphClient<Role, Operations>({
        ...defaultClientConfig,
        ...config
    })
}

export type Queries = ClientOperationDefs<{
{{#each queries}}
    {{operationName}}: {
        {{#if hasInput}}input: {{operationName}}Input{{else}}input?: undefined{{/if}}
        data: {{operationName}}ResponseData
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}>

export type Mutations = ClientOperationDefs<{
{{#each mutations}}
    {{operationName}}: {
        {{#if hasInput}}input: {{operationName}}Input{{else}}input?: undefined{{/if}}
        data: {{operationName}}ResponseData
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}>

export type Subscriptions = ClientOperationDefs<{
{{#each subscriptions}}
    {{operationName}}: {
        {{#if hasInput}}input: {{operationName}}Input{{else}}input?: undefined{{/if}}
        data: {{operationName}}ResponseData
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
{{#each liveQueries}}
    {{operationName}}: {
        {{#if hasInput}}input: {{operationName}}Input{{else}}input?: undefined{{/if}}
        data: {{operationName}}ResponseData
        isLiveQuery: true
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}>

export type Operations = ClientOperations<Queries, Mutations, Subscriptions>
`;
