import { Response } from '@whatwg-node/fetch';
import { FastifyBaseLogger } from 'fastify';

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * Create a fetch function that logs its requests and responses to the
 * given logger.
 *
 * Requests and responses are logged at debug level. If fetch throws, the
 * error is logged at warn level and the exception is propagated.
 *
 * @param logger Logger to send the logged messages to
 * @param fetch Fetch function to wrap
 * @returns A wrapper to fetch that logs requests and responses
 */
export const loggedFetch = <F extends FetchFn>(logger: FastifyBaseLogger, fetchFn: F): F => {
	const fn = async (...args: [RequestInfo | URL, RequestInit?]): Promise<Response> => {
		const input = args[0];
		const init = args[1];
		logger.debug({ input, init }, 'upstream request');
		const before = new Date();
		try {
			// make sure we pass all arguments, since the fetch functions from mesh
			// do use extra ones
			const resp = await fetchFn(...args);
			const text = await resp.text();
			const duration = new Date().getDate() - before.getDate();
			logger.debug(
				{ headers: Object.fromEntries(resp.headers.entries()), status: resp.status, text, duration: `${duration}ms` },
				'upstream response'
			);
			return new Response(text, resp);
		} catch (error: any) {
			logger.warn({ error }, 'upstream fetch failed');
			throw error;
		}
	};
	return fn as F;
};
