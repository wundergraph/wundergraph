import { createSvelteClient } from '@wundergraph/svelte-query';
import { createClient } from '../.wundergraph/generated/client';
import type { Operations } from '../.wundergraph/generated/client';

const client = createClient();

const { createFileUpload, createMutation, createQuery, createSubscription, getAuth, getUser, queryKey, prefetchQuery } =
	createSvelteClient<Operations>(client);

export { createFileUpload, createMutation, createQuery, createSubscription, getAuth, getUser, queryKey, prefetchQuery };
