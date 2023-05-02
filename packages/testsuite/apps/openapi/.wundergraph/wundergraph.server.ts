import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import { getHttpResponseError } from '@wundergraph/sdk/client';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			NoteByID: {
				postResolve: async ({ response }) => {
					const error = response?.errors?.[0];
					if (error) {
						const httpError = getHttpResponseError(error);
						if (httpError) {
							console.log('HTTP status code', httpError.statusCode);
							console.log('HTTP response headers', httpError.headers);
							console.log('HTTP response body', httpError.text);
						}
					}
				},
			},
		},
		mutations: {},
	},
}));
