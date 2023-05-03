import { createWunderGraphRelayApp } from '@wundergraph/react-relay';
import { createClient } from '../../../.wundergraph/generated/client';

const client = createClient();

export const { WunderGraphRelayProvider, useLiveQuery, fetchWunderGraphSSRQuery, getEnvironment } =
	createWunderGraphRelayApp({
		client,
	});
