import { createWunderGraphRelayClientApp } from '@wundergraph/react-relay/next/client';
import { client } from './';

export const { wunderGraphRelayClientWrapper } = createWunderGraphRelayClientApp({ client });
