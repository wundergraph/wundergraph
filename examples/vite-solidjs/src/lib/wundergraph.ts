import { createHooks } from '@wundergraph/solid-query';
import { createClient, Operations } from '../generated/client';

const client = createClient();

const { createQuery, createMutation, createSubscription, createFileUpload, queryKey, useAuth, useUser } =
	createHooks<Operations>(client);

export { createQuery, createMutation, createSubscription, createFileUpload, queryKey, useAuth, useUser };
