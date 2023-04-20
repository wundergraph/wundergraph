import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ operations }) => {
		return {
			hello: 'world',
		};
	},
});
