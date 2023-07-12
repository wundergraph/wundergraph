import { createOperation, z, OpenApiAgentFactory } from '../../generated/wundergraph.factory';

export default createOperation.query({
	input: z.object({
		url: z.string(),
	}),
	description: 'Load metadata like title, description, social media images, headlines, and summary from a website',
	handler: async ({ operations, input, openAI }) => {
		const metaData = await getMetaData(openAI, input.url);
		const links = await getLinks(openAI, input.url);
		return {
			links,
			...metaData,
		};
	},
});

const getMetaData = async (openAI: OpenApiAgentFactory, url: string) => {
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
			{
				name: 'openai/summarize_url_content',
			},
		],
		structuredOutputSchema: z.object({
			title: z.string(),
			description: z.string(),
			h1: z.string(),
			summary: z.string(),
		}),
	});
	const out = await agent.execWithPrompt({
		prompt: `Load the content of the URL: ${url}
		You're a HTML parser. Your job is to extract the title, description and h1 from the HTML.
		Do not include the HTML tags in the result.
		Don't change the content, just extract the information.
		
		Once this is done, add a summary of the website.
		`,
		outPrompt: 'Set the result to the out function in a structured way',
		debug: true,
	});
	return out.structuredOutput;
};

const getLinks = async (openAI: OpenApiAgentFactory, url: string) => {
	const agent = openAI.createAgent({
		model: 'gpt-3.5-turbo-16k-0613',
		functions: [
			{
				name: 'openai/load_url',
				pagination: {
					pageSize: 1024 * 15,
					maxPages: 3,
				},
			},
		],
		structuredOutputSchema: z.object({
			links: z.array(z.string()),
		}),
	});
	const out = await agent.execWithPrompt({
		prompt: `Load the content of the URL: ${url}
		You're a HTML parser. Your job is to extract links from the HTML.
		Do not include the HTML tags in the result.
		Don't change the content, just extract the links.
		Exclude links that are not visible or meaningful to the user,
		like links to images, scripts, js, stylesheets, fonts, etc.
		`,
		outPrompt: 'Set the result to the out function in a structured way',
		debug: true,
	});
	return out.structuredOutput.links;
};
