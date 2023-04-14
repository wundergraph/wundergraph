import { createWunderGraphRelayApp } from '../../../../../packages/react-relay';
import { createClient } from '../../../.wundergraph/generated/nextjs/client';

const client = createClient();

export const { usePreloadedQuery, WunderGraphRelayProvider, fetchWunderGraphSSRQuery } = createWunderGraphRelayApp({
	client,
});
