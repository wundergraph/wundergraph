import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
	handler: async function* ({ operations, graph }) {
		// get `405 Method Not Allowed`
		// const updates = await operations.subscribe({
		// 	operationName: 'federation/PriceUpdates',
		// 	subscribeOnce: true,
		// });

		// for await (const update of updates) {
		// 	const data = update.data?.federated_updatedPrice ?? undefined;
		// 	if (!data) {
		// 		continue;
		// 	}
		// 	yield {
		// 		name: data.name,
		// 		upc: data.upc,
		// 		weight: data.weight,
		// 	};
		// }

		const updates2 = await graph.from('federated').subscribe('updatedPrice').exec();

		for await (const update of updates2) {
			yield {
				name: update.name,
				upc: update.upc,
				weight: update.weight,
			};
		}
	},
});
