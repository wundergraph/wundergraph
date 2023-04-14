import { createWunderGraphRelayApp } from '@wundergraph/nextjs-relay';
import { client } from '../components/generated/nextjs';

export const { usePreloadedQuery, useEnvironment, WunderGraphRelaySSRProvider, fetchWunderGraphSSRQuery } =
	createWunderGraphRelayApp({ client });
