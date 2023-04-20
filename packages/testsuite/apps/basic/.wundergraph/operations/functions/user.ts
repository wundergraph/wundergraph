import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	handler: async ({ operations }) => {
		const name = 'Jens';
		const greeting = operations.query({
			operationName: 'functions/greeting',
			input: {
				name,
			},
		});

		return {
			name: 'Jens',
			greeting,
		};
	},
});
