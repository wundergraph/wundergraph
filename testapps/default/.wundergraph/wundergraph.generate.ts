import { configureWunderGraphGeneration } from '@wundergraph/sdk';
import { templates } from '@wundergraph/sdk';
import { golangClient } from '@wundergraph/golang-client';

export default configureWunderGraphGeneration({
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
			],
		},
		{
			templates: [
				...golangClient.all({
					packageName: 'client',
				}),
			],
			path: './generated/golang/client',
		},
	],
	operationsGeneration: (config) => {
		config.includeNamespaces('weather', 'federated');
	},
});
