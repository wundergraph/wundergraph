import { createSvelteClient } from '@wundergraph/svelte-query';
import { createClient } from '../.wundergraph/generated/client';

const client = createClient();

const { createFileUpload, createMutation, createQuery, createSubscription, getAuth, getUser, queryKey, prefetchQuery } =
	createSvelteClient(client);

export { createFileUpload, createMutation, createQuery, createSubscription, getAuth, getUser, queryKey, prefetchQuery };
