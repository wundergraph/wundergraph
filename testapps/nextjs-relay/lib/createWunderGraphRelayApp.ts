import { createWunderGraphRelayApp } from '@wundergraph/nextjs-relay';
import { client } from '../components/generated/nextjs';

export const { createClientEnvironment, createServerEnvironment, usePreloadedQuery, withWunderGraphRelay } =
	createWunderGraphRelayApp(client);
