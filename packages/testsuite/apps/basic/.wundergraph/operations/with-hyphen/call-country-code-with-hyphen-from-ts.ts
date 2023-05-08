import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ operations }) => {
		return operations.query({
			operationName: 'with-hyphen/country-code-with-hyphen',
		});
	},
});
