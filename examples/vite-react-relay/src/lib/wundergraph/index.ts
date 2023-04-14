import { createClient } from '../../../.wundergraph/generated/client';
import { createWunderGraphRelayApp } from '../../../../../packages/react-relay/src/createWunderGraphRelayApp';

const client = createClient();

export const { WunderGraphRelayProvider, usePreloadedQuery } = createWunderGraphRelayApp({ client });
