import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	// by specifying the input schema, we're automatically creating a JSON Schema for input validation
	input: z.object({}),
	handler: async ({ user }) => {
		return {
			...user,
		};
	},
});
