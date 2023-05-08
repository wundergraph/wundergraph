import { createOperation, z } from '../../generated/wundergraph.factory';
import { ExtractResponse } from '@wundergraph/sdk/dist/operations';

const sub = createOperation.subscription({
	input: z.object({
		id: z.string(),
	}),
	response: z.object({
		bio: z.string(),
		counter: z.number(),
		time: z.string().nullable(),
	}),
	handler: async function* (ctx) {
		let bio =
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl nec ultricies tincidunt, nunc nisl aliquam nisl, eget aliquam nunc';
		let time: string | null = null;

		yield {
			bio: bio,
			counter: 0,
			time,
		};

		try {
			for (let i = 0; i < 2; i++) {
				const isOdd = i % 2 === 0;
				if (i === 5) {
					time = new Date().toISOString();
				}
				if (isOdd) {
					bio =
						bio +
						' Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl nec ultricies tincidunt, nunc nisl aliquam nisl, eget aliquam nunc';
				}
				yield {
					bio: bio,
					counter: i,
					time,
				};
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		} finally {
			console.log('Client disconnected');
		}
	},
});

type SubRes = ExtractResponse<typeof sub>;

export default sub;
