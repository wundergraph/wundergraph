import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		url: z.string(),
	}),
	response: z.object({
		summary: z.string(),
	}),
	description: 'Summarize the content of a URL',
	handler: async ({ operations, input, log, openAI }) => {
		const data = await fetch(input.url).then((res) => res.text());
		const agent = openAI.createAgent({
			model: 'gpt-3.5-turbo-16k-0613',
			functions: [
				{
					name: 'openai/load_url',
					pagination: {
						pageSize: 1024 * 15,
						maxPages: 1,
					},
				},
			],
			structuredOutputSchema: z.object({
				summary: z.string(),
			}),
		});
		const out = await agent.execWithPrompt({
			prompt: `Load the content of the URL: ${input.url}
			Summarize the content of the website.
			`,
			outPrompt: 'Do a summary of all the results and return it as a single string in the out function',
			debug: true,
		});
		return {
			summary: out.structuredOutput.summary,
		};
	},
});
