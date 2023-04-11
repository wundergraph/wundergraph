import { createWunderGraphRelayApp } from '@wundergraph/nextjs-relay';
import { client } from '../components/generated/nextjs';

export const { createClientEnvironment, createServerEnvironment, useLivePreloadedQuery, withWunderGraphRelay } =
	createWunderGraphRelayApp(client);
