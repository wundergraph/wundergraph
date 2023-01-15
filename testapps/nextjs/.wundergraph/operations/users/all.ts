import { createOperation } from '@wundergraph/sdk';
import { z } from 'zod';

export default createOperation.query({
	handler: async () => {
		return [
			{
				id: 1,
				userName: 'Jens',
			},
			{
				id: 2,
				userName: 'Jannik',
			},
			{
				id: 3,
				userName: 'Leonie',
			},
		];
	},
});
