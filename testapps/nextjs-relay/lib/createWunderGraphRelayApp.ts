import { createWunderGraphRelayApp } from '@wundergraph/react-relay';
import { client } from '../components/generated/nextjs';

export const { usePreloadedQuery, WunderGraphRelaySSRProvider, fetchWunderGraphSSRQuery } = createWunderGraphRelayApp({
	client,
});
