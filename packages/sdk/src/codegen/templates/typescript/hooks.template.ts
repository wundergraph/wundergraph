//language=handlebars
export const template = `
import { {{ modelImports }} } from "./models"
import type { BaseRequestContext, WunderGraphRequest, WunderGraphResponse, AuthenticationResponse, AuthenticationHookRequest, HooksConfiguration, WsTransportOnConnectionInitResponse, PreUploadHookRequest, PreUploadHookResponse, PostUploadHookRequest, PostUploadHookResponse } from "@wundergraph/sdk/server";
import type { InternalClient } from "./wundergraph.internal.client"
import type { User } from "./wundergraph.server"
import { InternalOperationsClient } from "./wundergraph.internal.operations.client";

// TODO: Make this conditional
import {makeContext} from '../wundergraph.server';

type ContextField = typeof makeContext;
type ContextType = ContextField extends (...args: any) => any ? Awaited<ReturnType<ContextField>> : ContextField;

// use SKIP to skip the hook and continue the request / response chain without modifying the request / response
export type SKIP = "skip";

// use CANCEL to skip the hook and cancel the request / response chain
// this is semantically equal to throwing an error (500)
export type CANCEL = "cancel";

export type WUNDERGRAPH_OPERATION = {{{operationNamesUnion}}};

export type DATA_SOURCES = {{{dataSourcesUnion}}};

export interface HttpTransportHookRequest extends BaseRequestContext<User, InternalClient, InternalOperationsClient, ContextType> {
		request: WunderGraphRequest;
		operation: {
				name: WUNDERGRAPH_OPERATION;
				type: 'mutation' | 'query' | 'subscription';
		}
}
export interface HttpTransportHookRequestWithResponse extends BaseRequestContext<User, InternalClient, InternalOperationsClient, ContextType> {
		response: WunderGraphResponse;
    operation: {
        name: string;
        type: string;
    }
}
export interface WsTransportHookRequest extends BaseRequestContext<User, InternalClient, InternalOperationsClient, ContextType> {
	  dataSourceId: DATA_SOURCES;
		request: WunderGraphRequest;
}
export interface GlobalHooksConfig<Operations extends string = string, DataSources extends string = string> {
	httpTransport?: {
		// onRequest is called right before the request is sent to the origin
		// it can be used to modify the request
		// you can return SKIP to skip the hook and continue the request chain without modifying the request
		// you can return CANCEL to cancel the request chain and return a 500 error
		onOriginRequest?: {
			hook: (hook: HttpTransportHookRequest) => Promise<WunderGraphRequest | SKIP | CANCEL>;
			// calling the httpTransport hooks has a case, because the custom httpTransport hooks have to be called for each request
			// for this reason, you have to explicitly enable the hook for each Operation
			enableForOperations?: Operations[];
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
			enableForOperations?: Operations[];
			// enableForAllOperations will disregard the enableForOperations property and enable the hook for all operations
			enableForAllOperations?: boolean;
		};
	};
	wsTransport?: {
		// onConnectionInit is used to populate 'connection_init' message payload with custom data
		// it can be used to authenticate the websocket connection
		onConnectionInit?: {
			hook: (hook: WsTransportHookRequest) => Promise<WsTransportOnConnectionInitResponse>;
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
			enableForDataSources: DataSources[];
		};
	};
}
        
export type JSONValue =
    | string
    | number
    | boolean
    | JSONObject
    | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };
										
export interface HookRequest extends BaseRequestContext<User, InternalClient, InternalOperationsClient, ContextType> {}

export interface HookRequestWithResponse<Response> extends HookRequest {
		response: Response;
}

export interface HookRequestWithInput<Input> extends HookRequest {
		input: Input; 
}
						
export interface HooksConfig
	extends HooksConfiguration<Queries, Mutations, Subscriptions, Uploads, User, InternalClient, GlobalHooksConfig<WUNDERGRAPH_OPERATION, DATA_SOURCES>> {
	authentication?: {
		postAuthentication?: (hook: AuthenticationHookRequest<User, InternalClient>) => Promise<void>;
		mutatingPostAuthentication?: (
			hook: AuthenticationHookRequest<User, InternalClient>
		) => Promise<AuthenticationResponse<User>>;
		revalidate?: (hook: AuthenticationHookRequest<User, InternalClient>) => Promise<AuthenticationResponse<User>>;
		postLogout?: (hook: AuthenticationHookRequest<User, InternalClient>) => Promise<void>;
	};
	queries?: Queries;
	mutations?: Mutations;
	subscriptions?: Subscriptions;
}

export interface Queries {
{{#if hasQueries}}
    {{#each queries}}
        {{operationName}}?: {
        mockResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<{{operationName}}Response>;
        preResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<void>;
        {{#if hasInternalInput}} mutatingPreResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<Injected{{operationName}}Input>;{{/if}}
        postResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}} & HookRequestWithResponse<{{operationName}}Response>) => Promise<void>;
        customResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<void | {{operationName}}Response | null>;
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

export interface Subscriptions {
{{#if hasSubscriptions}}
		{{#each subscriptions}}
				{{operationName}}?: {
        preResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<void>;
        {{#if hasInternalInput}} mutatingPreResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}}) => Promise<Injected{{operationName}}Input>;{{/if}}
        postResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}} & HookRequestWithResponse<{{operationName}}Response>) => Promise<void>;
        mutatingPostResolve?: (hook: {{#if hasInternalInput}}HookRequestWithInput<Injected{{operationName}}Input>{{else}}HookRequest{{/if}} & HookRequestWithResponse<{{operationName}}Response>) => Promise<{{operationName}}Response>;
        }
		{{/each}}
{{/if}}
}

export interface Uploads {
    {{#each uploadProviders}}
        {{name}}?: {
            {{#each uploadProfiles}}
                {{@key}}?: {
                    preUpload?: (hook: PreUploadHookRequest<User>) => PreUploadHookResponse;
                    postUpload?: (hook: PostUploadHookRequest<User, InternalClient>) => PostUploadHookResponse;
                }
            {{/each}}
        }
    {{/each}}
}
`;
