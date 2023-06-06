import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ internalClient }) => {
		const root = await internalClient.queries.InternalRootInternal();
		const nested = await internalClient.queries.NestedInternalInternal();

		return {
			root,
			nested,
		};
	},
});
