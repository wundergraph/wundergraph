import { createOperation } from '@wundergraph/sdk';
import { z } from 'zod';

export default createOperation.query({
	input: z.object({
		id: z.string(),
	}),
	handler: async (input) => {
		return {
			id: input.id,
			name: 'Jens',
		};
	},
});
