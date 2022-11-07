import { Client } from '@wundergraph/sdk/client';
import { WunderGraphContextValue } from '@wundergraph/swr';

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
	 * Custom WunderGraph cache context.
	 */
	context?: React.Context<WunderGraphContextValue>;
}
