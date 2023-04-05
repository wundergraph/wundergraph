import { Middleware } from 'swr';
import { createClient } from '../.wundergraph/generated/client';
import { useAuth } from '@clerk/nextjs';
import { useAuthMiddleware } from '@wundergraph/nextjs';

export const client = createClient();

export const useWunderGraphClerk: Middleware = (useSWRNext) => {
	const auth = useAuth();

	return useAuthMiddleware(useSWRNext, async () => {
		return auth.getToken({ template: 'wundergraph' });
	});
};
