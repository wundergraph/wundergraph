import { createWunderGraphRelayApp } from '@wundergraph/relay-nextjs';
import { client } from '../components/generated/nextjs';

export const { createClientEnvironment, createServerEnvironment, useLivePreloadedQuery, withWunderGraphRelay } =
	createWunderGraphRelayApp(client);
