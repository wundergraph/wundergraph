/**
 * Important: This file must be compatible with Next.js https://nextjs.org/docs/api-reference/edge-runtime
 */

import React, { createContext, useContext, useEffect, useState, Dispatch, SetStateAction, Context } from 'react';

import { WunderGraphClient, User } from '@wundergraph/sdk/client';

export type Headers = { [key: string]: string };

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export interface WunderGraphContextProperties<Role> {
	ssrCache: { [key: string]: Promise<any> | {} };
	authenticationEnabled?: boolean;
	client: WunderGraphClient<Role>;
	user: User<Role> | null;
	setUser: Dispatch<SetStateAction<User<Role> | null>>;
	isWindowFocused: 'pristine' | 'focused' | 'blurred';
	refetchMountedOperations: number;
	setRefetchMountedOperations: Dispatch<SetStateAction<number>>;
}

export const defaultContext = createContext<WunderGraphContextProperties<any> | undefined>(undefined);

function getWunderGraphContext<Role>(context?: Context<WunderGraphContextProperties<Role> | undefined>) {
	if (context) {
		return context;
	}

	return defaultContext;
}

export interface WunderGraphProviderOptions<Role> {
	client: WunderGraphClient<Role>;
	user?: User<Role> | null;
	ssrCache?: { [key: string]: Promise<any> | {} };
	context?: Context<WunderGraphContextProperties<Role> | undefined>;
	logPrerenderTime?: boolean;
	disableFetchUserServerSide?: boolean;
	disableFetchUserClientSide?: boolean;
	disableFetchUserOnWindowFocus?: boolean;
}

export interface WunderGraphProviderProps<Role> extends WunderGraphProviderOptions<Role> {
	children: React.ReactNode;
}

export const WunderGraphProvider = <Role extends any>(props: WunderGraphProviderProps<Role>) => {
	const { children, context } = props;
	const Context = getWunderGraphContext(context);

	const value = useWunderGraphProvider(props);

	return <Context.Provider value={value}>{children}</Context.Provider>;
};

function useWunderGraphProvider<Role>(props: WunderGraphProviderProps<Role>): WunderGraphContextProperties<Role> {
	const { client, ssrCache = {} } = props;
	const [user, setUser] = React.useState<User<Role> | null>(props.user || null);
	const [isWindowFocused, setIsWindowFocused] = useState<'pristine' | 'focused' | 'blurred'>('pristine');
	const [refetchMountedOperations, setRefetchMountedOperations] = useState<number>(0);

	useEffect(() => {
		const onFocus = () => {
			setIsWindowFocused('focused');
		};
		const onBlur = () => {
			setIsWindowFocused('blurred');
		};
		window.addEventListener('focus', onFocus);
		window.addEventListener('blur', onBlur);
		return () => {
			window.removeEventListener('focus', onFocus);
			window.removeEventListener('blur', onBlur);
		};
	}, []);

	const [disableFetchUserClientSide] = useState(props?.disableFetchUserClientSide === true);
	const [disableFetchUserOnWindowFocus] = useState(props?.disableFetchUserOnWindowFocus === true);

	useEffect(() => {
		if (disableFetchUserClientSide) {
			return;
		}
		const abort = new AbortController();
		if (user === null) {
			(async () => {
				try {
					const nextUser = await props.client.fetchUser(abort.signal);
					if (JSON.stringify(nextUser) === JSON.stringify(user)) {
						return;
					}
					setUser(nextUser);
				} catch (e) {}
			})();
		}
		return () => {
			abort.abort();
		};
	}, [disableFetchUserClientSide]);

	useEffect(() => {
		if (disableFetchUserClientSide) {
			return;
		}
		if (disableFetchUserOnWindowFocus) {
			return;
		}
		if (isWindowFocused !== 'focused') {
			return;
		}
		const abort = new AbortController();
		(async () => {
			try {
				const nextUser = await props.client.fetchUser(abort.signal);
				if (JSON.stringify(nextUser) === JSON.stringify(user)) {
					return;
				}
				setUser(nextUser);
			} catch (e) {
				setUser(null);
			}
		})();
		return () => {
			abort.abort();
		};
	}, [isWindowFocused, disableFetchUserClientSide, disableFetchUserOnWindowFocus]);

	return { client, ssrCache, isWindowFocused, user, setUser, refetchMountedOperations, setRefetchMountedOperations };
}

interface UseWunderGraphContextOptions {
	strict?: boolean;
	errorMessage?: string;
	name?: string;
}

export function useWunderGraphContext<Role>(
	context?: Context<WunderGraphContextProperties<Role> | undefined>,
	options: UseWunderGraphContextOptions = {}
) {
	const {
		name = 'useWunderGraph',
		errorMessage = `${name} 'client' is undefined. Did you forget to wrap your app or page with 'withWunderGraph'?`,
	} = options;
	const ctx = useContext(getWunderGraphContext<Role>(context));

	if (!ctx || !ctx.client) {
		const error = new Error(errorMessage);
		error.name = 'ContextError';
		Error.captureStackTrace?.(error, useWunderGraphContext);
		throw error;
	}

	return ctx;
}
