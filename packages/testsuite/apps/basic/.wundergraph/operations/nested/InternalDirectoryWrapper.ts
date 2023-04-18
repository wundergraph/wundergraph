import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ operations, internalClient }) => {
		const root = await operations.query({
			operationName: 'internal/rootInternal',
		});
		const nested = await internalClient.queries.NestedInternalInternal();

		return {
			root,
			nested,
		};
	},
});
