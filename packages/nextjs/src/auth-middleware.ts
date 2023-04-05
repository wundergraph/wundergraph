import { BareFetcher, Middleware, SWRHook } from 'swr';
import { useWunderGraphContext } from './context';

type MiddlewareReturn = ReturnType<Middleware>;

export type AuthMiddleware = (
	useSWRNext: SWRHook,
	/**
	 * A function that returns an authentication token.
	 * Returning null will unset the authorization header.
	 */
	getToken: () => Promise<string | null | undefined>
) => MiddlewareReturn;

export const useAuthMiddleware: AuthMiddleware = (useSWRNext, getToken) => {
	return (key, fetcher, config) => {
		const context = useWunderGraphContext();

		const fetcherWithAuth: BareFetcher<Promise<unknown>> = async (...args) => {
			try {
				const token = await getToken();
				if (token) {
					context?.client.setAuthorizationToken(token);
				} else if (token === null) {
					context?.client.unsetAuthorization();
				}
			} catch (e: any) {
				context?.client.unsetAuthorization();
				throw e;
			}

			return fetcher?.(...args);
		};

		return useSWRNext(key, fetcherWithAuth, config);
	};
};
