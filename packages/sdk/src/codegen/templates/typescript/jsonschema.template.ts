//language=handlebars
export const template = `
// @ts-ignore: no-types available		
import {JSONSchema7} from "json-schema";

interface Schema {
    {{#each operations}}
    {{name}}: {
        input: JSONSchema7,
        response: JSONSchema7,
    },
    {{/each}}
}

const jsonSchema: Schema = {
    {{#each operations}}
    {{name}}: {
        input: {{{inputSchema}}},
        response: {{{outputSchema}}},
    },
    {{/each}}
};
export default jsonSchema;
`;
