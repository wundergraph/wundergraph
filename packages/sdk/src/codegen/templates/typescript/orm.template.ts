//language=handlebars

export const schemasTemplate = `
  {{#each namespaces}}
  export * as {{name}} from './{{id}}'
  {{/each}}
`;

export const ormTemplate = `
import { OperationCreator, NamespacingExecutor } from '@wundergraph/sdk/orm'

import {
  {{#each namespaces}}
   {{name}},
  {{/each}}
} from './schemas'

const BASE_URL = "{{ baseUrl }}"

interface Schemas {
  {{#each namespaces}}
    {{id}}: {{name}}.Schema
  {{/each}}
}

const Schemas = {
  {{#each namespaces}}
    {{id}}: {{name}}.SCHEMA,
  {{/each}}
}

export const orm = {
	from<Namespace extends keyof typeof Schemas>(namespace: Namespace) {
      const executor = new NamespacingExecutor({
			baseUrl: BASE_URL,
			namespace,
		});
		const schema = Schemas[namespace]

		return new OperationCreator<{ schema: Schemas[Namespace] }>({
			schema: schema,
			executor,
		});
	},
};
`;
