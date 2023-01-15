import { createOperation } from '@wundergraph/sdk';

export default createOperation.query({
	handler: async () => {
		return {
			hello: 'world',
		};
	},
});
