import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
	handler: async function* ({ operations }) {
		const updates = await operations.subscribe({
			operationName: 'federation/PriceUpdates',
			subscribeOnce: true,
		});
		for await (const update of updates) {
			const data = update.data?.federated_updatedPrice ?? undefined;
			if (!data) {
				continue;
			}
			yield {
				name: data.name,
				upc: data.upc,
				weight: data.weight,
			};
		}
	},
});
