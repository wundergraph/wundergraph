import { useWunderGraphContext } from './context';
import { Key, Middleware } from 'swr';
import { BareFetcher, PublicConfiguration, SWRHook } from 'swr/_internal';
import { serialize } from '@wundergraph/sdk/internal';

type Operation = {
	operationName: string;
	input?: object;
	liveQuery?: boolean;
	subscription?: boolean;
};

const isOperation = (key: Key): key is Operation => {
	return !!(key && !Array.isArray(key) && typeof key === 'object' && 'operationName' in key);
};

interface SSRConfig<
	Data = any,
	Error = any,
	Fn extends
		| ((arg: string) => unknown)
		| ((arg: [any, ...unknown[]]) => unknown)
		| ((arg: readonly [any, ...unknown[]]) => unknown)
		| ((arg: Record<any, any>) => unknown)
		| ((
				arg: string | [any, ...unknown[]] | readonly [any, ...unknown[]] | Record<any, any>
		  ) => unknown) = BareFetcher<unknown>
> extends PublicConfiguration<Data, Error, Fn> {
	ssr?: boolean;
}

export const SSRMiddleWare = ((useSWRNext: SWRHook) => {
	return (key: Key, fetcher: BareFetcher<unknown> | null, config: SSRConfig) => {
		const swr = useSWRNext(key, fetcher, config);

		const context = useWunderGraphContext();

		const isSSR = typeof window === 'undefined' && context?.ssr && config.ssr !== false;

		if (!isOperation(key) || !context || !isSSR || !key) {
			return swr;
		}

		const { operationName, input, liveQuery, subscription } = key;

		const _key = serialize(key);

		const { ssrCache, client, user } = context;

		const shouldAuthenticate = client.isAuthenticatedOperation(operationName) && !user;

		let ssrFetcher = fetcher;
		if (!ssrFetcher && (liveQuery || subscription)) {
			// Live queries and subscriptions don't have a fetcher so we create one to fetch the initial data on SSR.
			ssrFetcher = async () => {
				const result = await client.query({ operationName, input, subscribeOnce: true });
				if (result.error) {
					throw result.error;
				}
				return result.data;
			};
		}

		if (ssrCache && !ssrCache[_key] && ssrFetcher && !shouldAuthenticate) {
			ssrCache[_key] = ssrFetcher(key);
		}

		return swr;
	};
}) as unknown as Middleware;
