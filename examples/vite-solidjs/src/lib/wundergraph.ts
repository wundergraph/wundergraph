import { createHooks } from './hooks';
import { createClient, Operations } from './generated/client';

const client = createClient();

const { createQuery, createMutation, createSubscription, queryKey, useAuth, useFileUpload, useUser } =
	createHooks<Operations>(client);

export { createQuery, createMutation, createSubscription, queryKey, useAuth, useFileUpload, useUser };
