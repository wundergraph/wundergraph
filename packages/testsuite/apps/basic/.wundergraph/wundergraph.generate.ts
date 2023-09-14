import { configureWunderGraphGeneration, templates } from '@wundergraph/sdk';
import { rustClient } from '@wundergraph/rust-client';

export default configureWunderGraphGeneration({
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
			],
		},
		{
			templates: rustClient(),
			path: '../rust/client',
		},
	],
	operationsGenerator: (config) => {
		config.includeNamespaces('weather');
	},
});
