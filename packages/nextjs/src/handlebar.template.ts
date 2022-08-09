//language=handlebars
export const handlebarTemplate = `
import { NextComponentType } from "next";
import { 
    withWunderGraph as withInternalWunderGraph,
    WithWunderGraphOptions,
} from "@wundergraph/nextjs";

import {
    useWunderGraph,
    wunderGraphClient,
    wunderGraphContext,
    AuthProviders,
    AuthProvider,
    S3Provider,
    Role,
    {{hookImports}}
} from './react'

// backwardscompatibility
export { useWunderGraph, AuthProviders, AuthProvider, S3Provider }

export const withWunderGraph = (Page: NextComponentType<any, any, any>, options?: Partial<WithWunderGraphOptions<Role>>) => withInternalWunderGraph(Page, {
    client: wunderGraphClient,
    context: wunderGraphContext,
    ...options,
    {{#if hasAuthProviders}}authenticationEnabled: true{{/if}}
});

export const useQuery = {
{{#each queriesWithInput}}
    {{name}}: use{{name}}Query,
{{/each}}
{{#each queriesWithoutInput}}
    {{name}}: use{{name}}Query,
{{/each}}
};

export const useMutation = {
{{#each mutationsWithoutInput}}
    {{name}}: use{{name}}Mutation,
{{/each}}
{{#each mutationsWithInput}}
    {{name}}: use{{name}}Mutation,
{{/each}}
};

export const useSubscription = {
{{#each subscriptionsWithInput}}
    {{name}}: use{{name}}Subscription,
{{/each}}
{{#each subscriptionsWithoutInput}}
    {{name}}: use{{name}}Subscription,
{{/each}}
};
            
export const useLiveQuery = {
{{#each liveQueriesWithInput}}
    {{name}}: use{{name}}LiveQuery,
{{/each}}
{{#each liveQueriesWithoutInput}}
    {{name}}: use{{name}}LiveQuery,
{{/each}}
};
`;
