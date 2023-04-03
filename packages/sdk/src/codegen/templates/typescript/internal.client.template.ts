// TODO: Unify error handling

//language=handlebars
export const template = `
import type { OperationArgsWithInput, InternalClient as BaseClient } from "@wundergraph/sdk/server";
import type { OperationErrors } from "./ts-operation-errors";
import { {{ modelImports }} } from "./models"

export interface Queries  {
{{#if hasInternalQueries}}
    {{#each internalQueries}}
        {{operationName}}: ({{#if hasInternalInput}}options: OperationArgsWithInput<Internal{{operationName}}Input>{{/if}}) => Promise<{{#if isTypeScriptOperation}}{ data?: {{operationName}}ResponseData, errors?: OperationErrors['{{operationPath}}'][] }{{else}}{ data?: {{operationName}}Response['data'], errors?: Required<{{operationName}}Response>['errors'] }{{/if}}>;
    {{/each}}
{{/if}}
}

export interface Mutations  {
{{#if hasInternalMutations}}
    {{#each internalMutations}}
        {{operationName}}: ({{#if hasInternalInput}}options: OperationArgsWithInput<{{operationName}}Input>{{/if}}) => Promise<{{#if isTypeScriptOperation}}{ data?: {{operationName}}ResponseData, errors?: OperationErrors['{{operationPath}}'][] }{{else}}{ data?: {{operationName}}Response['data'], errors?: Required<{{operationName}}Response>['errors'] }{{/if}}>;
    {{/each}}
{{/if}}
}

export interface InternalClient extends BaseClient<Queries, Mutations> {}
`;
