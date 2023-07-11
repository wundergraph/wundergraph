//language=handlebars
export const template = `
// @ts-ignore: no-types available		
import type {JSONSchema7} from "json-schema";

export interface Queries {
    {{#each queries}}
    "{{name}}": {
        input: JSONSchema7;
        response: JSONSchema7;
				operationType: string;
				description: string;
    },
    {{/each}}
}

export interface Mutations {
    {{#each mutations}}
    "{{name}}": {
        input: JSONSchema7;
        response: JSONSchema7;
				operationType: string;
				description: string;
    },
    {{/each}}
}

export interface Subscriptions {
    {{#each subscriptions}}
    "{{name}}": {
        input: JSONSchema7;
        response: JSONSchema7;
				operationType: string;
				description: string;
    },
    {{/each}}
}

export type Schema = Queries & Mutations & Subscriptions;

const jsonSchema: Schema = {
    {{#each operations}}
    "{{name}}": {
        input: {{{inputSchema}}},
        response: {{{outputSchema}}},
				operationType: "{{operationType}}",
				description: "{{description}}",
    },
    {{/each}}
};

export type QueryNames = {{{queryNames}}};

export type MutationNames = {{{mutationNames}}};

export type SubscriptionNames = {{{subscriptionNames}}};

export default jsonSchema;
`;
