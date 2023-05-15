import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.mutation({
	handler: async ({ context }) => {
		return {
			hello: context.hello(),
		};
	},
});
