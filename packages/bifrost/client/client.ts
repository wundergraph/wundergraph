import { createPromiseClient, createConnectTransport, Interceptor } from '@bufbuild/connect-web';
import { KVService } from '../gen/bifrost/bifrost_connectweb';
import './fetch-polyfill';

export const NewClient = () => {
	const injectAuth: Interceptor = (next) => async (req) => {
		console.log(`sending message to ${req.url} body: ${JSON.stringify(req.message)}`);
		req.header.set('Authorization', `Bearer HEHEHEHE`);
		return await next(req);
	};

	const transport = createConnectTransport({
		baseUrl: 'http://localhost:8080',
		interceptors: [injectAuth],
	});

	return createPromiseClient(KVService, transport);
};
