//language=handlebars
export const template = `
import type { OperationsClientType } from "@wundergraph/sdk/server";
import { {{ modelImports }} } from "./models"

export interface Queries {
{{#if hasInternalQueries}}
    {{#each internalQueries}}
        '{{operationPath}}': { input: {{#if hasInternalInput}}Internal{{operationName}}Input{{ else }}never{{/if}}, response: {{ operationName }}Response };
    {{/each}}
{{/if}}
}

export interface Mutations {
{{#if hasInternalMutations}}
    {{#each internalMutations}}
			'{{operationPath}}': { input: {{#if hasInternalInput}}Internal{{operationName}}Input{{ else }}never{{/if}}, response: {{ operationName }}Response };
    {{/each}}
{{/if}}
}

export interface Subscriptions {
{{#if hasInternalSubscriptions}}
		{{#each internalSubscriptions}}
			'{{operationPath}}': { input: {{#if hasInternalInput}}Internal{{operationName}}Input{{ else }}never{{/if}}, response: {{ operationName }}Response };
		{{/each}}
{{/if}}
}

export type InternalOperations = OperationsClientType<Queries, Mutations, Subscriptions>
`;
