import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
	handler: async function* ({ graph }) {
		const updates = await graph.from('federated').subscribe('updatedPrice').exec();

		for await (const update of updates) {
			yield {
				name: update.name,
				upc: update.upc,
				weight: update.weight,
			};
		}
	},
});
