import { createSvelteClient } from '@wundergraph/svelte-query';
import type { Operations } from '$lib/generated/client';
import {  createClient } from '$lib/generated/client';

const client = createClient();

export function createWGClient (customFetch?: (input: RequestInfo, init?: RequestInit) => Promise<globalThis.Response>) {	
	return createSvelteClient<Operations>(customFetch ? createClient({
		customFetch
	}) : createClient());
}

export const {
	createFileUpload,
	createMutation,
	createQuery,
	createSubscription,
	getAuth,
	getUser,
	queryKey
} = createWGClient()
