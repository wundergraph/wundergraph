// TODO: Unify error handling

//language=handlebars
export const template = `
import type { OperationsClientType } from "@wundergraph/sdk/server";
import type { OperationErrors } from "./ts-operation-errors";
import { {{ modelImports }} } from "./models"

export interface Queries {
{{#if hasInternalQueries}}
    {{#each internalQueries}}
        '{{operationPath}}': {
					input: {{#if hasInternalInput}}Internal{{operationName}}Input{{ else }}never{{/if}},
          response: {{#if isTypeScriptOperation}}{ data?: {{operationName}}ResponseData, errors?: OperationErrors['{{operationPath}}'][] }{{else}}{ data?: {{operationName}}Response['data'], errors?: Required<{{operationName}}Response>['errors'] }{{/if}}
				};
    {{/each}}
{{/if}}
}

export interface Mutations {
{{#if hasInternalMutations}}
    {{#each internalMutations}}
			'{{operationPath}}': {
				input: {{#if hasInternalInput}}Internal{{operationName}}Input{{ else }}never{{/if}},
      	response: {{#if isTypeScriptOperation}}{ data?: {{operationName}}ResponseData, errors?: OperationErrors['{{operationPath}}'][] }{{else}}{ data?: {{operationName}}Response['data'], errors?: Required<{{operationName}}Response>['errors'] }{{/if}}
			};
    {{/each}}
{{/if}}
}

export interface Subscriptions {
{{#if hasInternalSubscriptions}}
		{{#each internalSubscriptions}}
			'{{operationPath}}': {
				input: {{#if hasInternalInput}}Internal{{operationName}}Input{{ else }}never{{/if}},
      	response: {{#if isTypeScriptOperation}}{ data?: {{operationName}}ResponseData, errors?: OperationErrors['{{operationPath}}'][] }{{else}}{ data?: {{operationName}}Response['data'], errors?: Required<{{operationName}}Response>['errors'] }{{/if}}
			};
		{{/each}}
{{/if}}
}

export type InternalOperations = OperationsClientType<Queries, Mutations, Subscriptions>
`;
