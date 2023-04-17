import { createWunderGraphRelayApp } from '../../../../../packages/react-relay';
import { createClient } from '../../../.wundergraph/generated/nextjs/client';

const client = createClient();

export const { WunderGraphRelayProvider, useLiveQuery, fetchWunderGraphSSRQuery } = createWunderGraphRelayApp({
	client,
});
