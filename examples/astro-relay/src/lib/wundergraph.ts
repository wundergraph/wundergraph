import { createClient } from '../../.wundergraph/generated/client';
import { createWunderGraphRelayApp } from '@wundergraph/react-relay';

const client = createClient();

export const { fetchWunderGraphSSRQuery } = createWunderGraphRelayApp({ client });
