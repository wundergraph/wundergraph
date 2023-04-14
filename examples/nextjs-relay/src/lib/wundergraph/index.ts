import { createWunderGraphRelayApp } from '@wundergraph/nextjs-relay';
import { createClient } from '../../../.wundergraph/generated/nextjs/client';

const client = createClient();

export const { createClientEnvironment, createServerEnvironment, usePreloadedQuery, withWunderGraphRelay } =
	createWunderGraphRelayApp({ client });
