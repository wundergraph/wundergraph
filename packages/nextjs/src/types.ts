import { Client, User } from '@wundergraph/sdk/client';
import { Middleware } from 'swr';

export type SSRCache = Record<string, any>;

export interface WunderGraphProviderProps {
	children: React.ReactNode;
	client: Client;
	context?: React.Context<WunderGraphContextValue | null>;
	ssrCache?: SSRCache;
	user?: User;
	ssr?: boolean;
}

export interface WunderGraphContextValue {
	ssrCache: SSRCache;
	ssr: boolean;
	client: Client;
	user?: User;
}

export interface WithWunderGraphOptions {
	/**
	 * The WunderGraph client.
	 */
	client: Client;
	/**
	 * The cache key used for user data.
	 * @default wg_user
	 */
	userCacheKey?: string;
	/**
	 * SSR enabled.
	 * @default true
	 */
	ssr?: boolean;
	/**
	 * Fetch user server side, disable this when authenticated is disabled.
	 * @default true
	 */
	fetchUserSSR?: boolean;
	/**
	 * Log the render to time to console.
	 */
	logPrerenderTime?: boolean;
	/**
	 * Log fetch errors to console.
	 */
	logFetchErrors?: boolean;
	/**
	 * Custom WunderGraph cache context.
	 */
	context?: React.Context<WunderGraphContextValue | null>;
	/**
	 * Custom SWR middleware.
	 */
	use?: Middleware[];
}
