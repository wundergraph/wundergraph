//language=handlebars

export const schemasTemplate = `
  {{#each namespaces}}
  export * as {{name}} from './{{id}}'
  {{/each}}
`;

export const ormTemplate = `
import type { ORM as ORMClass } from '@wundergraph/sdk/orm'

import {
  {{#each namespaces}}
   {{name}},
  {{/each}}
} from './schemas'

export interface Schemas {
  {{#each namespaces}}
    {{id}}: {{name}}.Schema
  {{/each}}
}

export const SCHEMAS = {
  {{#each namespaces}}
    {{id}}: {{name}}.SCHEMA,
  {{/each}}
}

export type ORM = ORMClass<Schemas>
`;

export const emptyOrm = `
/**
 * Warning: Enable the ORM by setting \`experimental.orm\` to \`true\` in your \`wundergraph.config.ts\`.
 */
export type ORM = undefined
`;
