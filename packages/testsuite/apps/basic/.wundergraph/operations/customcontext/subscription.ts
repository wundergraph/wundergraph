import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
	handler: async function* ({ context }) {
		for (let i = 0; i < 10; i++) {
			yield {
				hello: context.hello(),
			};
		}
	},
});
