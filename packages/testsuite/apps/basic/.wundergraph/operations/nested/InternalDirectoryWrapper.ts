import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ internalClient }) => {
		return internalClient.queries.NestedInternalInternal();
	},
});
