import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ clientRequest }) => {
		return clientRequest.headers.get('X-Request-ID') || '';
	},
});
