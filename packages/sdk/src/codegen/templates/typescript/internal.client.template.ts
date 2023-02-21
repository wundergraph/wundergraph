//language=handlebars
export const template = `
import type { OperationArgsWithInput, InternalClient as BaseClient } from "@wundergraph/sdk/server";
import { {{ modelImports }} } from "./models"

export interface Queries  {
{{#if hasInternalQueries}}
    {{#each internalQueries}}
        {{operationName}}: ({{#if hasInternalInput}}options: OperationArgsWithInput<Internal{{operationName}}Input>{{/if}}) => Promise<{{operationName}}Response>;
    {{/each}}
{{else}}
  queries: {};
{{/if}}
}

export interface Mutations  {
{{#if hasInternalMutations}}
    {{#each internalMutations}}
        {{operationName}}: ({{#if hasInternalInput}}options: OperationArgsWithInput<{{operationName}}Input>{{/if}}) => Promise<{{operationName}}Response>;
    {{/each}}
{{else}}
  mutations: {};
{{/if}}
}

export interface InternalClient extends BaseClient<Queries, Mutations> {}
`;
