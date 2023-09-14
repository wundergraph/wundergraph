//language=handlebars
export const template = `
import type { UserListener } from "@wundergraph/sdk";
import type { OperationMetadata } from "@wundergraph/sdk/client";
import { Client } from "./wundergraph.client";
import type { User } from "./wundergraph.server";
import React, { createContext, FunctionComponent, useMemo, useEffect, useState, Dispatch, SetStateAction } from "react";
import {AppState} from 'react-native';

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
}

/**
 * @deprecated Use @wundergraph/swr instead
 */
export const WunderGraphProvider: FunctionComponent<Props> = ({
    endpoint = 'http://10.0.2.2:9991',
    extraHeaders,
    children,
}) => {
    const [initialized, setInitialized] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [currentAppState, setCurrentAppState] = useState('');
    const [refetchMountedQueries, setRefetchMountedQueries] = useState(new Date());
    const queryCache: {[key:string]:Object} = {};
    const client = useMemo<Client>(() => {
        const client = new Client({baseURL: endpoint, extraHeaders, operationMetadata});
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
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active' && currentAppState !== 'active') {
                setCurrentAppState('active');
                onFocus();
            }
            if (state === 'background' && currentAppState !== 'background') {
                setCurrentAppState('background');
                onBlur();
            }
        });
        return () => {
            subscription.remove();
        };
    }, [client]);
{{else}}
    useEffect(() => {
        setInitialized(true);
        const onFocus = () => {
            setOnWindowFocus(new Date());
            setInitialized(true);
        };
        const onBlur = () => {
            setOnWindowBlur(new Date());
            setInitialized(false);
        };
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active' && currentAppState !== 'active') {
                setCurrentAppState('active');
                onFocus();
            }
            if (state === 'background' && currentAppState !== 'background') {
                setCurrentAppState('background');
                onBlur();
            }
        });
        return () => {
            subscription.remove();
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
