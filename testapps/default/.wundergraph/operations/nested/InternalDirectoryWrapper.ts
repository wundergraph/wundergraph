import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ operations }) => {
		const root = await operations.query({
			operationName: 'internal/rootInternal',
		});

		const nested = await operations.query({
			operationName: 'nested/internal/Internal',
		});

		return {
			root,
			nested,
		};
	},
});
