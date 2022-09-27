//language=handlebars
export const template = `
import type { OperationArgsWithInput, InternalBaseClient } from "@wundergraph/sdk";
import { {{ modelImports }} } from "./models"

export interface Queries  {
{{#if hasInternalQueries}}
    {{#each internalQueries}}
        {{operationName}}: ({{#if hasInternalInput}}options: OperationArgsWithInput<Internal{{operationName}}Input>{{/if}}) => Promise<{{operationName}}Response>;
    {{/each}}
{{/if}}
}
		
export interface Mutations  {
{{#if hasInternalMutations}}
    {{#each internalMutations}}
        {{operationName}}: ({{#if hasInternalInput}}options: OperationArgsWithInput<{{operationName}}Input>{{/if}}) => Promise<{{operationName}}Response>;
    {{/each}}
{{/if}}
}

export interface InternalClient extends InternalBaseClient<Queries, Mutations> {}
`;
