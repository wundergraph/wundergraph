import { createRelayApp } from '@wundergraph/relay-nextjs';
import { client } from '../components/generated/nextjs';

export const { createClientEnvironment, createServerEnvironment } = createRelayApp(client);
