import { createHooks } from '@wundergraph/swr';
import { createClient, Operations } from '../components/generated/client';

const client = createClient();

const { useQuery, useMutation, useSubscription, useUser } = createHooks<Operations>(client);

export { useQuery, useMutation, useSubscription, useUser };
