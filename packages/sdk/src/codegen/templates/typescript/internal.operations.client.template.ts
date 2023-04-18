// TODO: Unify error handling

//language=handlebars
export const template = `
import type { OperationsClientType } from "@wundergraph/sdk/server";
import type { ClientOperationErrors } from "@wundergraph/sdk/client";
import type { OperationErrors } from "./ts-operation-errors";
import { {{ modelImports }} } from "./models"

export interface Queries {
{{#if hasInternalQueries}}
    {{#each internalQueries}}
        '{{operationPath}}': {
					input: {{#if hasInternalInput}}Internal{{operationName}}Input{{ else }}never{{/if}},
          response: {{#if isTypeScriptOperation}}{ data?: {{operationName}}ResponseData, error?: OperationErrors['{{operationPath}}'] }{{else}}{ data?: {{operationName}}Response['data'], error?: ClientOperationErrors }{{/if}}
				};
    {{/each}}
{{/if}}
}

export interface Mutations {
{{#if hasInternalMutations}}
    {{#each internalMutations}}
			'{{operationPath}}': {
				input: {{#if hasInternalInput}}Internal{{operationName}}Input{{ else }}never{{/if}},
      	response: {{#if isTypeScriptOperation}}{ data?: {{operationName}}ResponseData, error?: OperationErrors['{{operationPath}}'] }{{else}}{ data?: {{operationName}}Response['data'], error?: ClientOperationErrors }{{/if}}
			};
    {{/each}}
{{/if}}
}

export interface Subscriptions {
{{#if hasInternalSubscriptions}}
		{{#each internalSubscriptions}}
			'{{operationPath}}': {
				input: {{#if hasInternalInput}}Internal{{operationName}}Input{{ else }}never{{/if}},
      	response: {{#if isTypeScriptOperation}}{ data?: {{operationName}}ResponseData, error?: OperationErrors['{{operationPath}}'] }{{else}}{ data?: {{operationName}}Response['data'], error?: ClientOperationErrors }{{/if}}
			};
		{{/each}}
{{/if}}
}

export type InternalOperations = OperationsClientType<Queries, Mutations, Subscriptions>
`;
