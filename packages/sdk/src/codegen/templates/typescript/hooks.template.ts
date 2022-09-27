//language=handlebars
export const template = `
import { {{ modelImports }} } from "./models"
import type { BaseRequestContext, AuthenticationRequestContext, WunderGraphRequest, WunderGraphResponse, AuthenticationResponse } from "@wundergraph/sdk";
import type { InternalClient } from "./wundergraph.internal.client"
import type { User } from "./wundergraph.server"

export type AuthenticationHookRequest = BaseRequestContext<User, InternalClient> & AuthenticationRequestContext<User>

// use SKIP to skip the hook and continue the request / response chain without modifying the request / response
export type SKIP = "skip";

// use CANCEL to skip the hook and cancel the request / response chain
// this is semantically equal to throwing an error (500)
export type CANCEL = "cancel";

export type WUNDERGRAPH_OPERATION = {{{operationNamesUnion}}};

export interface HttpTransportHookRequest extends BaseRequestContext<User, InternalClient> {
		request: WunderGraphRequest;
		operation: {
				name: WUNDERGRAPH_OPERATION;
				type: 'mutation' | 'query' | 'subscription';
		}
}
export interface HttpTransportHookRequestWithResponse extends BaseRequestContext<User, InternalClient> {
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
        onOriginRequest?: {
            hook: (hook: HttpTransportHookRequest) => Promise<WunderGraphRequest | SKIP | CANCEL>;
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
        onOriginResponse?: {
            hook: (hook: HttpTransportHookRequestWithResponse) => Promise<WunderGraphResponse | SKIP | CANCEL>;
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
										
export interface HookRequest extends BaseRequestContext<User, InternalClient> {}

export interface HookRequestWithResponse<Response> extends HookRequest {
		response: Response;
}

export interface HookRequestWithInput<Input> extends HookRequest {
		input: Input; 
}
						
export interface HooksConfig {
    global?: GlobalHooksConfig;
    authentication?: {
        postAuthentication?: (hook: AuthenticationHookRequest) => Promise<void>;
        mutatingPostAuthentication?: (hook: AuthenticationHookRequest) => Promise<AuthenticationResponse<User>>;
        revalidate?: (hook: AuthenticationHookRequest) => Promise<AuthenticationResponse<User>>;
        postLogout?: (hook: AuthenticationHookRequest) => Promise<void>;
    };
{{#if hasQueries}}
    queries?: {
    {{#each queries}}
        {{operationName}}?: {
						mockResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<{{operationName}}Response>;
            preResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<void>;
        		{{#if hasInternalInput}} mutatingPreResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<Injected{{operationName}}Input>;{{/if}}
            postResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}} & HookRequestWithResponse<{{operationName}}Response>) => Promise<void>;
            customResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<void | {{operationName}}Response>;
            mutatingPostResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}} & HookRequestWithResponse<{{operationName}}Response>) => Promise<{{operationName}}Response>;
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
								mockResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<{{operationName}}Response>;
								preResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<void>;
								{{#if hasInternalInput}} mutatingPreResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<Injected{{operationName}}Input>;{{/if}}
								postResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}} & HookRequestWithResponse<{{operationName}}Response>) => Promise<void>;
								customResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<void | {{operationName}}Response>;
								mutatingPostResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}} & HookRequestWithResponse<{{operationName}}Response>) => Promise<{{operationName}}Response>;
            }
        {{/each}}
    };
{{else}}
    mutations?: {};
{{/if}}
}
`;
