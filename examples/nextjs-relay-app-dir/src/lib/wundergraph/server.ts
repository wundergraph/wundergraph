import { createWunderGraphRelayServerApp } from '@wundergraph/react-relay/next/server';
import { client } from './';

export const { fetchWunderGraphServerQuery } = createWunderGraphRelayServerApp({ client });
