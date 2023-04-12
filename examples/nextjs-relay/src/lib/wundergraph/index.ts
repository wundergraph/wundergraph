import { createWunderGraphRelayApp } from './wundergraph';
import { createClient } from '../../../.wundergraph/generated/nextjs/client';

const client = createClient();

export const { createClientEnvironment, createServerEnvironment, useLivePreloadedQuery, withWunderGraphRelay } =
	createWunderGraphRelayApp(client);
