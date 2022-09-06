//language=handlebars
export const handlebarTemplate = `
import type { {{ modelImports }} } from "./models";
import React, { createContext } from "react";
import { 
    WunderGraphProvider as InternalWunderGraphProvider,
    WunderGraphProviderProps,
    useWunderGraph as useWunderGraphInternal,
    useQuery,
    useMutation,
    useSubscription,
    WunderGraphContextProperties
} from "@wundergraph/{{packageName}}";

import {
    WunderGraphClient,
    QueryArgsWithInput,
    QueryArgs,
    SubscriptionArgs,
    SubscriptionArgsWithInput
} from "@wundergraph/sdk/client";

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

export const wunderGraphClient = new WunderGraphClient<Role>({
    applicationHash: "{{applicationHash}}",
    applicationPath: "{{applicationPath}}",
    baseURL: "{{baseURL}}",
    sdkVersion: "{{sdkVersion}}",
})

export const
    wunderGraphContext = createContext<WunderGraphContextProperties<Role> | undefined>(undefined);

export const WunderGraphProvider = (props: Partial<WunderGraphProviderProps<Role>> & { children: React.ReactNode }) => {
	return <InternalWunderGraphProvider client={wunderGraphClient} context={wunderGraphContext} {...props} />;
};

export const useWunderGraph = () => {
    return useWunderGraphInternal<Role,{{#if hasAuthProviders}}AuthProvider{{else}}""{{/if}},{{#if hasS3Providers}}S3Provider{{/if}}>({
        context: wunderGraphContext
    });
}

{{#each queriesWithInput}}
export const use{{name}}Query = (input: {{name}}Input, args?: QueryArgs) => useQuery<{{name}}Input, {{name}}ResponseData, Role>("{{name}}", input, {...args, context: wunderGraphContext, requiresAuthentication: {{requiresAuthentication}} });
{{/each}}
{{#each queriesWithoutInput}}
export const use{{name}}Query = (args?: QueryArgs) => useQuery<never, {{name}}ResponseData, Role>("{{name}}", undefined, { ...args, context: wunderGraphContext, requiresAuthentication: {{requiresAuthentication}} });
{{/each}}

{{#each mutationsWithInput}}
export const use{{name}}Mutation = () => useMutation<{{name}}Input, {{name}}ResponseData, Role>("{{name}}", { context: wunderGraphContext, requiresAuthentication: {{requiresAuthentication}} });
{{/each}}
{{#each mutationsWithoutInput}}
export const use{{name}}Mutation = () => useMutation<never, {{name}}ResponseData, Role>("{{name}}", { context: wunderGraphContext, requiresAuthentication: {{requiresAuthentication}} });
{{/each}}

{{#each subscriptionsWithInput}}
export const use{{name}}Subscription = (input: {{name}}Input, args?: SubscriptionArgs) => useSubscription<{{name}}Input, {{name}}ResponseData, Role>("{{name}}", input, { ...args, context: wunderGraphContext, requiresAuthentication: {{requiresAuthentication}} });
{{/each}}
{{#each subscriptionsWithoutInput}}
export const use{{name}}Subscription = (args?: SubscriptionArgs) => useSubscription<never, {{name}}ResponseData, Role>("{{name}}", undefined, { ...args, context: wunderGraphContext, requiresAuthentication: {{requiresAuthentication}} });
{{/each}}

{{#each liveQueriesWithInput}}
export const use{{name}}LiveQuery = (input: {{name}}Input, args?: SubscriptionArgs) => useSubscription<{{name}}Input, {{name}}ResponseData,Role>("{{name}}", input, { ...args, isLiveQuery: true, context: wunderGraphContext, requiresAuthentication: {{requiresAuthentication}} } );
{{/each}}
{{#each liveQueriesWithoutInput}}
export const use{{name}}LiveQuery = (args?: SubscriptionArgs) => useSubscription<never, {{name}}ResponseData, Role>("{{name}}", undefined, { ...args, isLiveQuery: true, context: wunderGraphContext, requiresAuthentication: {{requiresAuthentication}} } );
{{/each}}
`;
