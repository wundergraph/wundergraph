import { createOperation, z } from '../../generated/wundergraph.factory';

// <div>{data?.name}</div>
// 			<div>{data?.price}</div>
// 			<div>{data?.weight}</div>

export default createOperation.mutation({
	input: z.object({
		id: z.string(),
		name: z.string(),
		price: z.string(),
	}),
	handler: async ({ input }) => {
		return {
			...input,
		};
	},
});
