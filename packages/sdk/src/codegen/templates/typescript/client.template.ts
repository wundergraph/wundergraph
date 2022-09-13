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

export interface Queries {
{{#each queries}}
    {{operationName}}: {
        input: {{#if hasInput}}{{operationName}}Input{{else}}never{{/if}}
        data: {{operationName}}ResponseData
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}

export interface Mutations {
{{#each mutations}}
    {{operationName}}: {
        input: {{#if hasInput}}{{operationName}}Input{{else}}never{{/if}}
        data: {{operationName}}ResponseData
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}

export interface Subscriptions {
{{#each subscriptions}}
    {{operationName}}: {
        input: {{#if hasInput}}{{operationName}}Input{{else}}never{{/if}}
        data: {{operationName}}ResponseData
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}

export interface LiveQueries {
{{#each liveQueries}}
    {{operationName}}: {
        input: {{#if hasInput}}{{operationName}}Input{{else}}never{{/if}}
        data: {{operationName}}ResponseData
        requiresAuthentication: {{requiresAuthentication}}
    }
{{/each}}
}

export type Operations = ClientOperations<Queries, Mutations, Subscriptions, LiveQueries>
`;
