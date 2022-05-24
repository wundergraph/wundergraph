//language=handlebars
export const template = `
import { {{ modelImports }} } from "./models"

export interface InternalClient {
    {{#if hasInternalQueries}}
    queries: {
        {{#each internalQueries}}
            {{operationName}}: ({{#if hasInternalInput}}input: Internal{{operationName}}Input{{/if}}) => Promise<{{operationName}}Response>;
        {{/each}}
    };
    {{else}}
    queries: {};
    {{/if}}
    {{#if hasInternalMutations}}
        mutations: {
        {{#each internalMutations}}
            {{operationName}}: ({{#if hasInternalInput}}input: Internal{{operationName}}Input{{/if}}) => Promise<{{operationName}}Response>;
        {{/each}}
        };
    {{else}}
    mutations: {};
    {{/if}}
    withHeaders: (headers: { [key: string]: string }) => InternalClient;
}
`;
