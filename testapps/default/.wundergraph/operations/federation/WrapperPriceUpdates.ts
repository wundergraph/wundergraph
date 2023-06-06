import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
	handler: async function* ({ operations }) {
		const updates = await operations.subscribe({
			operationName: 'federation/CustomPriceUpdates',
		});
		for await (const update of updates) {
			yield update;
		}
	},
});
