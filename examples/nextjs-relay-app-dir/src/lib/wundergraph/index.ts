// Based on: https://nextjs.org/docs/messages/context-in-server-component

import { createWunderGraphRelayApp } from '@wundergraph/react-relay';
import { client } from './client';

export const { useLiveQuery, fetchWunderGraphSSRQuery } = createWunderGraphRelayApp({
	client,
});
