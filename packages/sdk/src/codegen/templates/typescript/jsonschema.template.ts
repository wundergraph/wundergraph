//language=handlebars
export const template = `
// @ts-ignore: no-types available		
import type {JSONSchema7} from "json-schema";

// @ts-ignore: module unavailable
declare module 'json-schema' {
	export interface JSONSchema7 {
		'x-graphql-enum-name'?: string;
	}
}

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

{{#if hasQueries}}
export type QueryNames = {{{queryNames}}};
{{else}}
export type QueryNames = never;
{{/if}}

{{#if hasMutations}}
export type MutationNames = {{{mutationNames}}};
{{else}}
export type MutationNames = never;
{{/if}}

{{#if hasSubscriptions}}
export type SubscriptionNames = {{{subscriptionNames}}};
{{else}}
export type SubscriptionNames = never;
{{/if}}

export default jsonSchema;
`;
