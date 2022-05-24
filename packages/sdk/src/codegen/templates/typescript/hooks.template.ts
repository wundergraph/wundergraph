//language=handlebars
export const template = `
import { {{ modelImports }} } from "./models"
import type { WunderGraphRequestContext, Context, WunderGraphRequest, WunderGraphResponse } from "@wundergraph/sdk";
import type { InternalClient } from "./wundergraph.internal.client"
import type { User } from "./wundergraph.server"

export type AuthenticationResponse = AuthenticationOK | AuthenticationDeny;

export interface AuthenticationOK {
    status: "ok";
    user: User;
}

export interface AuthenticationDeny {
    status: "deny";
    message: string;
}

// use SKIP to skip the hook and continue the request / response chain without modifying the request / response
export type SKIP = "skip";

// use CANCEL to skip the hook and cancel the request / response chain
// this is semantically equal to throwing an error (500)
export type CANCEL = "cancel";

export type WUNDERGRAPH_OPERATION = {{{ operationNamesUnion}}} ;

export interface GlobalHooksConfig {
    httpTransport?: {
        // onRequest is called right before the request is sent
        // it can be used to modify the request
        // you can return SKIP to skip the hook and continue the request chain without modifying the request
        // you can return CANCEL to cancel the request chain and return a 500 error
        // not returning anything or undefined has the same effect as returning SKIP
        onRequest?: {
            hook: (ctx: WunderGraphRequestContext<User>, request: WunderGraphRequest) => Promise<WunderGraphRequest | SKIP | CANCEL | void>;
            // calling the httpTransport hooks has a case, because the custom httpTransport hooks have to be called for each request
            // for this reason, you have to explicitly enable the hook for each Operation
            enableForOperations?: WUNDERGRAPH_OPERATION[];
            // enableForAllOperations will disregard the enableForOperations property and enable the hook for all operations
            enableForAllOperations?: boolean;
        };
        // onResponse is called right after the response is received
        // it can be used to modify the response
        // you can return SKIP to skip the hook and continue the response chain without modifying the response
        // you can return CANCEL to cancel the response chain and return a 500 error
        // not returning anything or undefined has the same effect as returning SKIP
        onResponse?: {
            hook: (ctx: WunderGraphRequestContext<User>, response: WunderGraphResponse) => Promise<WunderGraphResponse | SKIP | CANCEL | void>;
            // calling the httpTransport hooks has a case, because the custom httpTransport hooks have to be called for each request
            // for this reason, you have to explicitly enable the hook for each Operation
            enableForOperations?: WUNDERGRAPH_OPERATION[];
            // enableForAllOperations will disregard the enableForOperations property and enable the hook for all operations
            enableForAllOperations?: boolean;
        };
    }
}
        
export type JSONValue =
    | string
    | number
    | boolean
    | JSONObject
    | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export interface HooksConfig {
    global?: GlobalHooksConfig;
    authentication?: {
        postAuthentication?: (user: User) => Promise<void>;
        mutatingPostAuthentication?: (user: User) => Promise<AuthenticationResponse>;
        revalidate?: (user: User) => Promise<AuthenticationResponse>;
    };
{{#if hasQueries}}
    queries?: {
    {{#each queries}}
        {{operationName}}?: {
            mockResolve?: ({{#if hasInternalInput}}ctx: Context<User,InternalClient>, input: Injected{{operationName}}Input{{else}}ctx: Context<User,InternalClient>{{/if}}) => Promise<{{operationName}}Response>;
            preResolve?: ({{#if hasInternalInput}}ctx: Context<User,InternalClient>, input: Injected{{operationName}}Input{{else}}ctx: Context<User,InternalClient>{{/if}}) => Promise<void>;{{#if hasInternalInput}}
            mutatingPreResolve?: (ctx: Context<User,InternalClient>, input: Injected{{operationName}}Input) => Promise<Injected{{operationName}}Input>;{{/if}}
            postResolve?: (ctx: Context<User,InternalClient>{{#if hasInternalInput}}, input: Injected{{operationName}}Input{{/if}},response: {{operationName}}Response) => Promise<void>;
            customResolve?: ({{#if hasInternalInput}}ctx: Context<User,InternalClient>, input: Injected{{operationName}}Input{{else}}ctx: Context<User,InternalClient>{{/if}}) => Promise<void | {{operationName}}Response>;
            mutatingPostResolve?: ({{#if hasInternalInput}}ctx: Context<User,InternalClient>, input: Injected{{operationName}}Input{{else}}ctx: Context<User,InternalClient>{{/if}}, response: {{operationName}}Response) => Promise<{{operationName}}Response>;
        }
    {{/each}}
    };
{{else}}
    queries?: {};
{{/if}}
{{#if hasMutations}}
    mutations?: {
        {{#each mutations}}
            {{operationName}}?: {
                mockResolve?: ({{#if hasInternalInput}}ctx: Context<User,InternalClient>, input: Injected{{operationName}}Input{{else}}ctx: Context<User,InternalClient>{{/if}}) => Promise<{{operationName}}Response>;
                preResolve?: ({{#if hasInternalInput}}ctx: Context<User,InternalClient>, input: Injected{{operationName}}Input{{else}}ctx: Context<User,InternalClient>{{/if}}) => Promise<void>;{{#if hasInternalInput}}
                mutatingPreResolve?: (ctx: Context<User,InternalClient>{{#if hasInternalInput}}, input: Injected{{operationName}}Input{{/if}}) => Promise<Injected{{operationName}}Input>;{{/if}}
                postResolve?: (ctx: Context<User,InternalClient>{{#if hasInternalInput}}, input: Injected{{operationName}}Input{{/if}}, response: {{operationName}}Response) => Promise<void>;
                customResolve?: ({{#if hasInternalInput}}ctx: Context<User,InternalClient>, input: Injected{{operationName}}Input{{else}}ctx: Context<User,InternalClient>{{/if}}) => Promise<void | {{operationName}}Response>;
                mutatingPostResolve?: ({{#if hasInternalInput}}ctx: Context<User,InternalClient>, input: Injected{{operationName}}Input{{else}}ctx: Context<User,InternalClient>{{/if}}, response: {{operationName}}Response) => Promise<{{operationName}}Response>;
            }
        {{/each}}
    };
{{else}}
    mutations?: {};
{{/if}}
}
`;
