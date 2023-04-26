import { configureWunderGraphGeneration, templates } from '@wundergraph/sdk';

export default configureWunderGraphGeneration({
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
			],
		},
	],
	operationsGenerator: (config) => {
		config.includeNamespaces('weather');
	},
});
