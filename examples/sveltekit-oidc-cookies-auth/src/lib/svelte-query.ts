import { createSvelteClient } from '@wundergraph/svelte-query';
import type { Operations } from '$lib/generated/client';
import {  createClient } from '$lib/generated/client';

export function createWGClient (customFetch?: (input: RequestInfo, init?: RequestInit) => Promise<globalThis.Response>) {	
	return createSvelteClient<Operations>(customFetch ? createClient({
		customFetch
	}) : createClient());
}



