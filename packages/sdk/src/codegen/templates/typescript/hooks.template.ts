//language=handlebars
export const template = `
import { {{ modelImports }} } from "./models"
import type { BaseRequestContext, WunderGraphRequest, WunderGraphResponse, AuthenticationResponse, AuthenticationHookRequest, HooksConfiguration } from "@wundergraph/sdk";
import type { InternalClient } from "./wundergraph.internal.client"
import type { User } from "./wundergraph.server"

// use SKIP to skip the hook and continue the request / response chain without modifying the request / response
export type SKIP = "skip";

// use CANCEL to skip the hook and cancel the request / response chain
// this is semantically equal to throwing an error (500)
export type CANCEL = "cancel";

export type WUNDERGRAPH_OPERATION = {{{operationNamesUnion}}};
export type DATA_SOURCES = {{{dataSourcesUnion}}};

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
    },
    wsTransport?: {
        // onConnectionInit is used to populate 'connection_init' message payload with custom data
        // it can be used to authenticate the websocket connection
        onConnectionInit?: {
            hook: (hook: HttpTransportHookRequest) => Promise<any>;
            /**
             * enableForDataSources will enable the hook for specific data sources.
             * you should provide a list of data sources ids
             * an id is the identifier of the data source in the wundergraph.config.ts file 
             * @example
             *const chat = introspect.graphql({             
             *	id: 'chatId',
						 *	apiNamespace: 'chat',
						 *	url: 'http://localhost:8085/query',
						 *});
             */
       	    enableForDataSources?: DATA_SOURCES[]; 
        }
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
						
export interface HooksConfig extends HooksConfiguration<Queries, Mutations, User, InternalClient> {
    global?: GlobalHooksConfig;
    authentication?: {
        postAuthentication?: (hook: AuthenticationHookRequest<User, InternalClient>) => Promise<void>;
        mutatingPostAuthentication?: (hook: AuthenticationHookRequest<User, InternalClient>) => Promise<AuthenticationResponse<User>>;
        revalidate?: (hook: AuthenticationHookRequest<User, InternalClient>) => Promise<AuthenticationResponse<User>>;
        postLogout?: (hook: AuthenticationHookRequest<User, InternalClient>) => Promise<void>;
    };
		{{#if hasQueries}}
				queries?: Queries,
		{{/if}}
		{{#if hasMutations}}
				mutations?: Mutations
		{{/if}}
}

export interface Queries {
{{#if hasQueries}}
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
{{/if}}
}

export interface Mutations {
{{#if hasMutations}}
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
{{/if}}
}
`;
