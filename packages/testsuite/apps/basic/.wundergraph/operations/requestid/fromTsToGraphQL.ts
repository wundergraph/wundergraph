import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ operations }) => {
		const { data, error } = await operations.query({ operationName: 'requestid/graphql' });
		if (error) {
			throw error;
		}
		return data;
	},
});
