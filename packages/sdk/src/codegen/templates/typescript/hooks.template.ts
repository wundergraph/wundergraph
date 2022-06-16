//language=handlebars
export const template = `
import { {{ modelImports }} } from "./models"
import type { Context, WunderGraphRequest, WunderGraphResponse } from "@wundergraph/sdk";
import type { InternalClient } from "./wundergraph.internal.client"
import type { User } from "./wundergraph.server"

export interface AuthenticationHooksRequest extends Context<User, InternalClient> {}

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

export type WUNDERGRAPH_OPERATION = {{{operationNamesUnion}}};

export interface HttpTransportHooksRequest extends Context<User,InternalClient> {
		request: WunderGraphRequest;
		operation: {
				name: WUNDERGRAPH_OPERATION;
				type: 'mutation' | 'query' | 'subscription';
		}
}
export interface HttpTransportHooksRequestWithResponse extends Context<User,InternalClient> {
		response: WunderGraphResponse;
    operation: {
        name: string;
        type: string;
    }
}
export interface GlobalHooksConfig {
    httpTransport?: {
        // onRequest is called right before the request is sent to the origin
        // it can be used to modify the request
        // you can return SKIP to skip the hook and continue the request chain without modifying the request
        // you can return CANCEL to cancel the request chain and return a 500 error
        // not returning anything or undefined has the same effect as returning SKIP
        onOriginRequest?: {
            hook: (hook: HttpTransportHooksRequest) => Promise<WunderGraphRequest | SKIP | CANCEL | void>;
            // calling the httpTransport hooks has a case, because the custom httpTransport hooks have to be called for each request
            // for this reason, you have to explicitly enable the hook for each Operation
            enableForOperations?: WUNDERGRAPH_OPERATION[];
            // enableForAllOperations will disregard the enableForOperations property and enable the hook for all operations
            enableForAllOperations?: boolean;
        };
        // onResponse is called right after the response is received from the origin
        // it can be used to modify the response
        // you can return SKIP to skip the hook and continue the response chain without modifying the response
        // you can return CANCEL to cancel the response chain and return a 500 error
        // not returning anything or undefined has the same effect as returning SKIP
        onOriginResponse?: {
            hook: (hook: HttpTransportHooksRequestWithResponse) => Promise<WunderGraphResponse | SKIP | CANCEL | void>;
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
										
export interface HooksRequest extends Context<User,InternalClient> {}

export interface HooksRequestWithResponse<Response> extends HooksRequest {
		response: Response;
}

export interface HooksRequestWithInput<Input> extends HooksRequest {
		input: Input; 
}
						
export interface HooksConfig {
    global?: GlobalHooksConfig;
    authentication?: {
        postAuthentication?: (hook: AuthenticationHooksRequest) => Promise<void>;
        mutatingPostAuthentication?: (hook: AuthenticationHooksRequest) => Promise<AuthenticationResponse>;
        revalidate?: (hook: AuthenticationHooksRequest) => Promise<AuthenticationResponse>;
    };
{{#if hasQueries}}
    queries?: {
    {{#each queries}}
        {{operationName}}?: {
						mockResolve?: (hook: {{#if hasInternalInput}}HooksRequestWithInput<Injected{{operationName}}Input>{{else}}HooksRequest{{/if}}) => Promise<{{operationName}}Response>;
            preResolve?: (hook: {{#if hasInternalInput}}HooksRequestWithInput<Injected{{operationName}}Input>{{else}}HooksRequest{{/if}}) => Promise<void>;
        		{{#if hasInternalInput}} mutatingPreResolve?: (hook: {{#if hasInternalInput}}HooksRequestWithInput<Injected{{operationName}}Input>{{else}}HooksRequest{{/if}}) => Promise<Injected{{operationName}}Input>;{{/if}}
            postResolve?: (hook: {{#if hasInternalInput}}HooksRequestWithInput<Injected{{operationName}}Input>{{else}}HooksRequest{{/if}} & HooksRequestWithResponse<{{operationName}}Response>) => Promise<void>;
            customResolve?: (hook: {{#if hasInternalInput}}HooksRequestWithInput<Injected{{operationName}}Input>{{else}}HooksRequest{{/if}}) => Promise<void | {{operationName}}Response>;
            mutatingPostResolve?: (hook: {{#if hasInternalInput}}HooksRequestWithInput<Injected{{operationName}}Input>{{else}}HooksRequest{{/if}} & HooksRequestWithResponse<{{operationName}}Response>) => Promise<{{operationName}}Response>;
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
								mockResolve?: (hook: {{#if hasInternalInput}}HooksRequestWithInput<Injected{{operationName}}Input>{{else}}HooksRequest{{/if}}) => Promise<{{operationName}}Response>;
								preResolve?: (hook: {{#if hasInternalInput}}HooksRequestWithInput<Injected{{operationName}}Input>{{else}}HooksRequest{{/if}}) => Promise<void>;
								{{#if hasInternalInput}} mutatingPreResolve?: (hook: {{#if hasInternalInput}}HooksRequestWithInput<Injected{{operationName}}Input>{{else}}HooksRequest{{/if}}) => Promise<Injected{{operationName}}Input>;{{/if}}
								postResolve?: (hook: {{#if hasInternalInput}}HooksRequestWithInput<Injected{{operationName}}Input>{{else}}HooksRequest{{/if}} & HooksRequestWithResponse<{{operationName}}Response>) => Promise<void>;
								customResolve?: (hook: {{#if hasInternalInput}}HooksRequestWithInput<Injected{{operationName}}Input>{{else}}HooksRequest{{/if}}) => Promise<void | {{operationName}}Response>;
								mutatingPostResolve?: (hook: {{#if hasInternalInput}}HooksRequestWithInput<Injected{{operationName}}Input>{{else}}HooksRequest{{/if}} & HooksRequestWithResponse<{{operationName}}Response>) => Promise<{{operationName}}Response>;
            }
        {{/each}}
    };
{{else}}
    mutations?: {};
{{/if}}
}
`;
