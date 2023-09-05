import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
	input: z.object({
		count: z.number().int().optional(),
		delay: z.number().int().optional(),
		repeat: z.boolean().optional(),
	}),
	handler: async function* ({ input }) {
		for (let ii = 0; ii < (input.count ?? 10); ii++) {
			yield {
				hello: input.repeat ?? false ? 'hello' : `${ii}`,
			};
			await new Promise((f) => setTimeout(f, input.delay ?? 1000));
		}
	},
});
