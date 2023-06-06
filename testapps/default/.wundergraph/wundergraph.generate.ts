import { configureWunderGraphGeneration, templates } from '@wundergraph/sdk';
import { golangClient } from '@wundergraph/golang-client';

export default configureWunderGraphGeneration({
	codeGenerators: [
		{
			templates: [
				...golangClient.all({
					packageName: 'client',
				}),
			],
			path: './generated/golang/client',
		},
	],
	operationsGenerator: (config) => {
		config.includeNamespaces('weather', 'federated');
	},
});
