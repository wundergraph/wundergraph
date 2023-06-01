import { createOperation } from '../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ graph }) => {
		const length = await graph
			.from('echo')
			.query('clientRequestContentLength')
			.exec();
		return {
			length,
		};
	},
});
