import { createClient } from '../../../.wundergraph/generated/client';
import { createWunderGraphRelayApp } from '@wundergraph/react-relay';

const client = createClient();

export const { WunderGraphRelayProvider, useLiveQuery } = createWunderGraphRelayApp({ client });
