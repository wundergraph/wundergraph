import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ clientRequest, log }) => {
		log.info('hello', { from: 'TypeScript operation' });
		return clientRequest.headers.get('X-Request-ID') || '';
	},
});
