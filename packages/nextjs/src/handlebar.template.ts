//language=handlebars
export const handlebarTemplate = `
import type { {{ modelImports }} } from "./models";
import { NextComponentType } from "next";
import { 
    withWunderGraph as withInternalWunderGraph,
    WithWunderGraphOptions,
} from "@wundergraph/nextjs";

import {
    QueryArgs,
	QueryArgsWithInput,
    MutationArgs,
    MutationArgsWithInput,
	SubscriptionArgsWithInput,
} from '@wundergraph/sdk/client';

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
    {{name}}: (args: QueryArgsWithInput<{{name}}Input>) => {
        const {input, ...options} = args
        const { refetch, isLoading, isSuccess, isError, isLazy, ...result } = use{{name}}Query(input, options)
        return {
            refetch,
            isLoading,
            isSuccess,
            isError,
            isLazy,
            result
        }
    },
{{/each}}
{{#each queriesWithoutInput}}
    {{name}}: (args?: QueryArgs) => {
        const { refetch, isLoading, isSuccess, isError, isLazy, ...result } = use{{name}}Query(args)
        return {
            refetch,
            isLoading,
            isSuccess,
            isError,
            isLazy,
            result
        }
    },
{{/each}}
};

export const useMutation = {
{{#each mutationsWithInput}}
    {{name}}: (args?: MutationArgs) => {
        const { mutate, ...result } = use{{name}}Mutation(args)
        return {
            result,
            mutate(args: MutationArgsWithInput<{{name}}Input>) {
                const {input, ...options} = args
                return mutate(input, options)
            }
        }
    },
{{/each}}
{{#each mutationsWithoutInput}}
    {{name}}: (args?: MutationArgs) => {
        const { mutate, ...result } = use{{name}}Mutation(args)
        return {
            result,
            mutate
        }
    },
{{/each}}
};

export const useSubscription = {
{{#each subscriptionsWithInput}}
    {{name}}: (args: SubscriptionArgsWithInput<{{name}}Input>) => {
        const { input, ...options } = args
        const { isLoading, isSuccess, isStopped, isError, ...result } = use{{name}}Subscription(input, options)
        return {
            isLoading,
            isSuccess,
            isStopped,
            isError,
            result
        }
    },
{{/each}}
{{#each subscriptionsWithoutInput}}
    {{name}}: (args: SubscriptionArgs) => {
        const { isLoading, isSuccess, isStopped, isError, ...result } = use{{name}}Subscription(args)
        return {
            isLoading,
            isSuccess,
            isStopped,
            isError,
            result
        }
    },
{{/each}}
};
            
export const useLiveQuery = {
{{#each liveQueriesWithInput}}
    {{name}}: (args: SubscriptionArgsWithInput<{{name}}Input>) => {
        const { input, ...options } = args
        const { isLoading, isSuccess, isStopped, isError, ...result } = use{{name}}LiveQuery(input, options)
        return {
            isLoading,
            isSuccess,
            isStopped,
            isError,
            result
        }
    },
{{/each}}
{{#each liveQueriesWithoutInput}}
    {{name}}: (args: SubscriptionArgs) => {
        const { isLoading, isSuccess, isStopped, isError, ...result } = use{{name}}LiveQuery(args)
        return {
            isLoading,
            isSuccess,
            isStopped,
            isError,
            result
        }
    },
{{/each}}
};
`;
