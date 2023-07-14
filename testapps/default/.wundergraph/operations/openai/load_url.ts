import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		url: z.string(),
	}),
	response: z.object({
		content: z.string(),
	}),
	description: 'Load the content of a url',
	handler: async ({ input, log }) => {
		log.debug('Loading url', input.url);
		const data = await fetch(input.url).then((res) => res.text());
		log.debug('Loaded url', input.url);
		return {
			content: data,
		};
	},
});
