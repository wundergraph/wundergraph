import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ operations }) => {
		const { data, error } = await operations.query({ operationName: 'requestid/ts' });
		console.log('DE', data, error);
		if (error) {
			throw error;
		}
		return data;
	},
});
