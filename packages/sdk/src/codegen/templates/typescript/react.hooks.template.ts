//language=handlebars
export const template = `
import {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {WunderGraphContext} from "./provider";
import { RequestOptions, MutateRequestOptions, SubscriptionRequestOptions, Response} from "@wundergraph/sdk"
{{#if hasImports}}import { {{imports}} } from "./models";{{/if}}

/**
 * @deprecated Use @wundergraph/swr instead
 */
export const useWunderGraph = () => {
    const ctx = useContext(WunderGraphContext)
    if (ctx === undefined) {
        throw new Error("WunderGraphContext missing, make sure to put WunderGraphProvider at the root of your app")
    }
    return {
        client: ctx.client,
        onWindowFocus: ctx.onWindowFocus,
        onWindowBlur: ctx.onWindowBlur,
{{#if hasAuthProviders}}
        user: ctx.user,
{{/if}}
        initialized: ctx.initialized,
        initializing: ctx.initializing,
        refetchMountedQueries: ctx.refetchMountedQueries,
        setRefetchMountedQueries: ctx.setRefetchMountedQueries,
        queryCache: ctx.queryCache,
    }
}

interface InternalOptions {
    requiresAuthentication: boolean;
}

{{#if hasQueries}}
    const Query = <R extends {}, I extends {}>(
        promiseFactory: (options: RequestOptions<I, R>) => Promise<Response<R>>,
        internalOptions: InternalOptions,
        options?: RequestOptions<I, R>
    ) => {
        const {initialized,{{#if hasAuthProviders}}user,{{/if}}onWindowFocus,refetchMountedQueries,queryCache} = useWunderGraph();
        const [_options, _setOptions] = useState<MutateRequestOptions<I>|undefined>(options);
        const [shouldFetch, setShouldFetch] = useState<boolean>(options === undefined || options.initialState === undefined);
        const refetch = useCallback((options?: RequestOptions<I, R>) => {
            if (options !== undefined) {
                _setOptions({
                    ...options,
                    lazy: false,
                });
            } else if (_options && _options.lazy === true){
                _setOptions({
                    ..._options,
                    lazy: false,
                });
            }
            setResponse({status: "loading"});
            setShouldFetch(true);
        }, []);
        useEffect(() => {
            if (options && options.refetchOnWindowFocus === true){
                setShouldFetch(true);
            }
        },[onWindowFocus])
        const [response, setResponse] = useState<Response<R>>((options !== undefined && options.initialState !== undefined) ? {
            status: "ok",
            body: options.initialState
        } : _options && _options.lazy === true ? {status: "lazy"} : {status: "loading"});
        useEffect(() => {
            if (!initialized){
                return;
            }
            {{#if hasAuthProviders}}
            if (internalOptions.requiresAuthentication && !user){
                setResponse({status: "requiresAuthentication"})
                return;
            }
            {{/if}}
            if (!shouldFetch) {
                return;
            }
            if (_options && _options.lazy === true){
                return;
            }
            const abortController = new AbortController();
            if (response.status === "ok"){
                setResponse({status: "ok", refetching: true , body: response.body})
            }
            const cacheKey = JSON.stringify(_options);
            const cached = queryCache[cacheKey];
            if (response.status !== "ok" && cached){
                setResponse({
                    status: "cached",
                    body: cached as R,
                });
            }
            (async () => {
                const result = await promiseFactory({
                    ..._options,
                    abortSignal: abortController.signal,
                });
                if (abortController.signal.aborted) {
                    setResponse({status: "aborted"});
                    return;
                }
                if (result.status === "ok"){
                    queryCache[cacheKey] = result.body;
                }
                setResponse(result);
                setShouldFetch(false);
            })();
            return () => {
                abortController.abort();
            };
        }, [{{#if hasAuthProviders}}user,{{/if}}initialized,shouldFetch, _options, promiseFactory]);
        useEffect(() => setShouldFetch(true),[{{#if hasAuthProviders}}user,{{/if}}refetchMountedQueries]);
        return {
            response,
            refetch,
        };
    };
{{/if}}

{{#if hasMutations}}
    const Mutation = <R extends {}, I extends {}>(
        promiseFactory: (options: RequestOptions<I, R>) => Promise<Response<R>>,
        internalOptions: InternalOptions,
        options?: MutateRequestOptions<I>
    ) => {
        const { {{#if hasAuthProviders}}user,{{/if}}setRefetchMountedQueries} = useWunderGraph();
        const [_options] = useState<MutateRequestOptions<I> | undefined >(options);
        const [response, setResponse] = useState<Response<R>>({ status: "none" });
        const mutate = useCallback(async (options?: MutateRequestOptions<I>) => {
    {{#if hasAuthProviders}}
            if (internalOptions.requiresAuthentication && !user) {
                setResponse({ status: "requiresAuthentication" });
                return;
            }
    {{/if}}
            const combinedOptions: MutateRequestOptions<I> = {
                refetchMountedQueriesOnSuccess: (options !== undefined && options.refetchMountedQueriesOnSuccess !== undefined) ? options.refetchMountedQueriesOnSuccess : _options?.refetchMountedQueriesOnSuccess,
                input: (options !== undefined && options.input !== undefined) ? options.input : _options?.input,
                abortSignal: (options !== undefined && options.abortSignal !== undefined) ? options.abortSignal : _options?.abortSignal,
            }
            setResponse({ status: "loading" });
            const result = await promiseFactory(combinedOptions);
            setResponse(result);
            if (result.status === "ok" && combinedOptions.refetchMountedQueriesOnSuccess === true) {
                setRefetchMountedQueries(new Date());
            }
        }, [{{#if hasAuthProviders}}user{{/if}}]);
        return {
            response,
            mutate,
        };
    };
{{/if}}

{{#if hasSubscriptionsOrLiveQueries }}{{#unless reactNative}}
const Subscription = <R, I>(
    subscriptionFactory: (options: RequestOptions<I>, cb: (response: Response<R>) => void) => void,
    internalOptions: InternalOptions,
    options?: SubscriptionRequestOptions<I>
) => {
    const optionsJSON = JSON.stringify(options);
    const { {{#if hasAuthProviders}}user,{{/if}} initialized, refetchMountedQueries } = useWunderGraph();
    const [_options, _setOptions] = useState<RequestOptions<I> | undefined>(options);
    const [response, setResponse] = useState<Response<R>>({ status: "loading" });
    const [lastInit,setLastInit] = useState<boolean|undefined>();
    const computedInit = useMemo<boolean>(()=>{
        if (lastInit === undefined){
            setLastInit(initialized)
            return initialized
        }
        if (options?.stopOnWindowBlur){
            return initialized
        }
        if (initialized){
            setLastInit(true)
            return true
        }
        return lastInit;
    },[initialized,lastInit,optionsJSON])
    useEffect(() => {
        _setOptions(options);
    }, [optionsJSON]);
    useEffect(() => {
        if (!computedInit) {
            return;
        }
{{#if hasAuthProviders}}
        if (internalOptions.requiresAuthentication && !user) {
            setResponse({ status: "requiresAuthentication" });
            return;
        }
{{/if}}
        const controller = new AbortController();
        subscriptionFactory(
            {
                ..._options,
                abortSignal: controller.signal,
            },
            (res) => {
                if (!controller.signal.aborted) setResponse(res);
            }
        );
        return () => {
            controller.abort();
        };
    }, [{{#if hasAuthProviders}}user,{{/if}} computedInit, _options, refetchMountedQueries]);
    return {
        response,
    };
};
{{/unless}}{{/if}}

export const useLoadingComplete = (...responses: Response<any>[]) => {
    const [loading,setLoading] = useState(true);
    useEffect(() => {
    const isLoading = responses.some((r) => r.status === "loading");
        if (isLoading !== loading) setLoading(isLoading);
    }, responses);
    return loading
}

{{#if hasQueries}}
export const useQuery = {
    {{#each queries}}
    {{name}}: (options{{#unless hasInput}}?{{/unless}}: RequestOptions<{{#if hasInput}}{{name}}Input{{else}}never{{/if}},{{name}}Response>) => {
        const {client} = useWunderGraph();
        return Query(client.query.{{name}},{requiresAuthentication: {{requiresAuthentication}} },options);
    },
    {{/each}}
}
{{/if}}

{{#if hasMutations}}
export const useMutation = {
{{#each mutations}}
    {{name}}: (options{{#unless hasInput}}?{{/unless}}: MutateRequestOptions<{{#if hasInput}}{{name}}Input{{else}}never{{/if}}>) => {
        const {client} = useWunderGraph();
        return Mutation(client.mutation.{{name}},{requiresAuthentication: {{requiresAuthentication}} } ,options);
    },
{{/each}}
}
{{/if}}

{{#if hasSubscriptions}}{{#unless reactNative}}
export const useSubscription = {
{{#each subscriptions}}
    {{name}}: (options{{#unless hasInput}}?{{/unless}}: SubscriptionRequestOptions{{#if hasInput}}<{{name}}Input>{{/if}}) => {
        const {client} = useWunderGraph();
        return Subscription(client.subscription.{{name}},{requiresAuthentication: {{requiresAuthentication}} }, options);
    },
{{/each}}
}
{{/unless}}{{/if}}

{{#if hasLiveQueries}}{{#unless reactNative}}
    export const useLiveQuery = {
    {{#each liveQueries }}
        {{name}}: (options{{#unless hasInput}}?{{/unless}}: SubscriptionRequestOptions{{#if hasInput}}<{{name}}Input>{{/if}}) => {
            const {client} = useWunderGraph();
            return Subscription(client.liveQuery.{{name}},{requiresAuthentication: {{requiresAuthentication}} }, options);
        },
    {{/each}}
    }
{{/unless}}{{/if}}
`;
