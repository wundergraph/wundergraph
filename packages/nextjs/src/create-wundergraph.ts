import { Client, OperationsDefinition } from '@wundergraph/sdk/client';
import { createHooks, UseQueryHook, UseSubscriptionHook } from '@wundergraph/swr';
import { WithWunderGraphOptions } from './types';
import { withWunderGraph } from './with-wundergraph';

export const createWunderGraphNext = <
	Operations extends OperationsDefinition,
	WunderGraphClient extends Client = Client
>(
	options: WithWunderGraphOptions<WunderGraphClient>
) => {
	const { client, ...rest } = options;

	const hooks = createHooks<Operations>(client);

	const _withWunderGraph = withWunderGraph({
		client,
		...rest,
	});

	return {
		withWunderGraph: _withWunderGraph,
		client,
		...hooks,
		useQuery: hooks.useQuery as UseQueryHook<Operations, { ssr?: boolean }>,
		useSubscription: hooks.useSubscription as UseSubscriptionHook<Operations, { ssr?: boolean }>,
	};
};
