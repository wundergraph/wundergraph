import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';
import { getHttpResponseError } from '@wundergraph/sdk/dist/client/errors';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			NoteByID: {
				postResolve: async ({ response }) => {
					const httpError = getHttpResponseError(response?.errors?.[0]);
					console.log('HTTP status code', httpError?.statusCode);
					console.log('HTTP response headers', httpError?.headers);
					console.log('HTTP response body', httpError?.text);
				},
			},
		},
		mutations: {},
	},
}));
