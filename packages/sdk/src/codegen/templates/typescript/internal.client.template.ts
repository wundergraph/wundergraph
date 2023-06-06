// TODO: Unify error handling

//language=handlebars
export const template = `
import type { OperationArgsWithInput, InternalClient as BaseClient } from "@wundergraph/sdk/server";
import type { OperationErrors } from "./ts-operation-errors";
import { {{ modelImports }} } from "./models"

export interface Queries  {
{{#if hasInternalQueries}}
    {{#each internalQueries}}
        {{operationName}}: ({{#if hasInternalInput}}options: OperationArgsWithInput<{{internalInputTypename}}>{{/if}}) => Promise<{{#if isTypeScriptOperation}}{ data?: {{responseDataTypename}}, errors?: OperationErrors['{{operationPath}}'][] }{{else}}{ data?: {{responseTypename}}['data'], errors?: Required<{{responseTypename}}>['errors'] }{{/if}}>;
    {{/each}}
{{/if}}
}

export interface Mutations  {
{{#if hasInternalMutations}}
    {{#each internalMutations}}
        {{operationName}}: ({{#if hasInternalInput}}options: OperationArgsWithInput<{{internalInputTypename}}>{{/if}}) => Promise<{{#if isTypeScriptOperation}}{ data?: {{responseDataTypename}}, errors?: OperationErrors['{{operationPath}}'][] }{{else}}{ data?: {{responseTypename}}['data'], errors?: Required<{{responseTypename}}>['errors'] }{{/if}}>;
    {{/each}}
{{/if}}
}

export interface InternalClient extends BaseClient<Queries, Mutations> {}
`;
