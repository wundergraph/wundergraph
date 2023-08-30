//language=handlebars
export const template = `
import { Client } from "./wundergraph.client";
import type { UserListener } from "@wundergraph/sdk";
import type { OperationMetadata } from "@wundergraph/sdk/client";
import type { User } from "./wundergraph.server";
import React, { createContext, FunctionComponent, useMemo, useEffect, useState, Dispatch, SetStateAction } from "react";

export interface Config {
    client: Client;
    initialized: boolean;
    initializing: boolean;
    onWindowFocus: Date;
    onWindowBlur: Date;
{{#if hasAuthProviders}}
    user?: User;
{{/if}}
    refetchMountedQueries: Date;
    setRefetchMountedQueries: Dispatch<SetStateAction<Date>>;
    queryCache: {
        [key:string]: Object
    };
}

const operationMetadata: OperationMetadata = {
{{#each allOperations}}
    {{operationName}}: {
        requiresAuthentication: {{requiresAuthentication}}
        }
    {{#unless @last}},{{/unless}}
{{/each}}
}

export const WunderGraphContext = createContext<Config | undefined>(undefined);

export interface Props {
    endpoint?: string;
    extraHeaders?: {[key:string]: string};
		children?: React.ReactNode;
    customFetch?: (input: RequestInfo, init?: RequestInit) => Promise<globalThis.Response>;
}

/**
 * @deprecated Use @wundergraph/swr instead
 */
export const WunderGraphProvider: FunctionComponent<Props> = ({ endpoint, extraHeaders, customFetch, children }) => {
    const [initialized, setInitialized] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [refetchMountedQueries, setRefetchMountedQueries] = useState(new Date());
    const queryCache: {[key:string]:Object} = {};
    const client = useMemo<Client>(() => {
        const client = new Client({baseURL: endpoint, extraHeaders, customFetch, operationMetadata});
        client.setLogoutCallback(()=>{
            Object.keys(queryCache).forEach(key => {
                delete queryCache[key];
            });
        })
        return client
    }, [endpoint,extraHeaders]);
    const [onWindowBlur, setOnWindowBlur] = useState(new Date());
    const [onWindowFocus, setOnWindowFocus] = useState(new Date());
{{#if hasAuthProviders }}
    const [user, setUser] = useState<User | undefined>();
    const userListener = useMemo<UserListener<User>>(() => {
        return (userOrNull) => {
            if (userOrNull === null){
                setUser(undefined);
            } else {
                setUser(userOrNull);
            }
        }
    },[]);
    useEffect(() => {
        client.setUserListener(userListener);
        (async () => {
            await client.fetchUser();
            setInitialized(true);
        })();
        const onFocus = async () => {
            setInitializing(true);
            await client.fetchUser();
            setOnWindowFocus(new Date());
            setInitialized(true);
            setInitializing(false);
        };
        const onBlur = () => {
            setInitialized(false);
            setOnWindowBlur(new Date());
        };
        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);
        return () => {
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
        };
    }, [client]);
{{else}}
    useEffect(() => {
        setInitialized(true);
        const onFocus = async () => {
            setOnWindowFocus(new Date());
            setInitialized(true);
        };
        const onBlur = () => {
            setOnWindowBlur(new Date());
            setInitialized(false);
        };
        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);
        return () => {
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
        };
    }, [client]);
{{/if}}
    const providerData = {
{{#if hasAuthProviders}}
        user,
{{/if}}
        onWindowBlur,
        onWindowFocus,
        client,
        initialized,
        initializing,
        refetchMountedQueries,
        setRefetchMountedQueries,
        queryCache,
    }
    return (
        <WunderGraphContext.Provider
            value={providerData}
        >
            {children}
        </WunderGraphContext.Provider>
    );
};

`;
