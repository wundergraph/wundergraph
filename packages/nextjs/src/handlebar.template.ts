//language=handlebars
export const handlebarTemplate = `
import type { {{ modelImports }} } from "./models";
import {createContext} from "react";
import { hooks, WunderGraphContextProperties, QueryArgsWithInput, SubscriptionArgs, SubscriptionArgsWithInput } from "@wundergraph/nextjs";
export type Role = {{{ roleDefinitions }}};

{{#if hasAuthProviders}}
export enum AuthProvider {
{{#each authProviders}}
    "{{.}}" = "{{.}}",
{{/each}}
}

export const AuthProviders = {
{{#each authProviders}}
    "{{.}}": AuthProvider.{{.}},
{{/each}}
};
{{/if}}

{{#if hasS3Providers}}
export enum S3Provider {
{{#each s3Providers}}
    "{{.}}" = "{{.}}",
{{/each}}
}
{{/if}}


const defaultWunderGraphContextProperties: WunderGraphContextProperties<Role> = {
    ssrCache: {},
    client: null,
    clientConfig: {
        applicationHash: "{{applicationHash}}",
        applicationPath: "{{applicationPath}}",
        baseURL: "{{baseURL}}",
        sdkVersion: "{{sdkVersion}}",
        authenticationEnabled: {{hasAuthProviders}},
    },
    user: null,
    setUser: value => {},
    isWindowFocused: "pristine",
    setIsWindowFocused: value => {},
    refetchMountedOperations: 0,
    setRefetchMountedOperations: value => {},
};

export const
    WunderGraphContext = createContext<WunderGraphContextProperties<Role>>(defaultWunderGraphContextProperties);

export const withWunderGraph = hooks.withWunderGraphContextWrapper(WunderGraphContext,defaultWunderGraphContextProperties);
				
export const useWunderGraph = hooks.useWunderGraph<Role,{{#if hasAuthProviders}}AuthProvider{{else}}""{{/if}},{{#if hasS3Providers}}S3Provider{{/if}}>(WunderGraphContext);
        
export const useQuery = {
{{#each queriesWithInput}}
    {{name}}: (args: QueryArgsWithInput<{{name}}Input>) => hooks.useQueryWithInput<{{name}}Input, {{name}}ResponseData,Role>(WunderGraphContext,{
        operationName: "{{name}}",
        requiresAuthentication: {{requiresAuthentication}},
    })(args),
{{/each}}
{{#each queriesWithoutInput}}
    {{name}}: hooks.useQueryWithoutInput<{{name}}ResponseData,Role>(WunderGraphContext,{
        operationName: "{{name}}",
        requiresAuthentication: {{requiresAuthentication}},
    }),
{{/each}}
};

export const useMutation = {
{{#each mutationsWithoutInput}}
    {{name}}: () => hooks.useMutationWithoutInput<{{name}}ResponseData,Role>(WunderGraphContext,{
        operationName: "{{name}}",
        requiresAuthentication: {{requiresAuthentication}},
    }),
{{/each}}
{{#each mutationsWithInput}}
    {{name}}: () => hooks.useMutationWithInput<{{name}}Input,{{name}}ResponseData,Role>(WunderGraphContext,{
        operationName: "{{name}}",
        requiresAuthentication: {{requiresAuthentication}},
    }),
{{/each}}
};

export const useSubscription = {
{{#each subscriptionsWithInput}}
    {{name}}: (args: SubscriptionArgsWithInput<{{name}}Input>) => hooks.useSubscriptionWithInput<{{name}}Input, {{name}}ResponseData,Role>(WunderGraphContext,{
        operationName: "{{name}}",
        isLiveQuery: false,
        requiresAuthentication: {{requiresAuthentication}},
    })(args),
{{/each}}
{{#each subscriptionsWithoutInput}}
    {{name}}: (args?: SubscriptionArgs) => hooks.useSubscriptionWithoutInput<{{name}}ResponseData,Role>(WunderGraphContext,{
        operationName: "{{name}}",
        isLiveQuery: false,
        requiresAuthentication: {{requiresAuthentication}},
    })(args),
{{/each}}
};
            
export const useLiveQuery = {
{{#each liveQueriesWithInput}}
    {{name}}: (args: SubscriptionArgsWithInput<{{name}}Input>) => hooks.useSubscriptionWithInput<{{name}}Input, {{name}}ResponseData,Role>(WunderGraphContext,{
        operationName: "{{name}}",
        isLiveQuery: true,
        requiresAuthentication: {{requiresAuthentication}},
    })(args),
{{/each}}
{{#each liveQueriesWithoutInput}}
    {{name}}: (args?: SubscriptionArgs) => hooks.useSubscriptionWithoutInput<{{name}}ResponseData,Role>(WunderGraphContext,{
        operationName: "{{name}}",
        isLiveQuery: true,
        requiresAuthentication: {{requiresAuthentication}},
    })(args),
{{/each}}
};
`;
