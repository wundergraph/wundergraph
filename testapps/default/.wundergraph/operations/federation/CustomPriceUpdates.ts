import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
	handler: async function* ({ operations, graph }) {
		// @bug this seems to cause the WunderNode (Go) server to crash
		// Maybe related to this? https://github.com/wundergraph/wundergraph/issues/686
		//
		// const updates = await operations.subscribe({
		// 	operationName: 'federation/PriceUpdates',
		// 	subscribeOnce: true,
		// });

		const updates2 = await graph
			.from('federated')
			.subscribe('updatedPrice')
			.exec()

		for await (const update of updates2) {
			yield {
				name: update.name,
				upc: update.upc,
				weight: update.weight,
			}
		}
	},
});
