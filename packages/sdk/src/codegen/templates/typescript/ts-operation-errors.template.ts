//language=handlebars
export const template = `
import type { ClientOperationErrors, GraphQLError } from '@wundergraph/sdk/client';

export type OperationErrors = {
  {{#each tsOperations}}
    '{{PathName}}': {{Name}}Errors,
  {{/each}}
}

{{#each uniqueErrors}}
export type Operation{{name}} = {
	code : '{{code}}',
	statusCode: {{statusCode}},
	message: '{{message}}'
}
{{/each}}

{{#each opToErrors}}
export type {{@key}}Errors =
{{#if this}}
	{{#each this}}
		| Operation{{name}}
		{{#if @last}}
		| ClientOperationErrors
		{{/if}}
	{{/each}}
	{{else}}
	ClientOperationErrors;
{{/if}}
{{/each}}
`;
