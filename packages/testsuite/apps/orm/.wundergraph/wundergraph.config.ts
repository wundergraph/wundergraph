import {
	configureWunderGraphApplication,
	introspect,
	templates,
	configureWunderGraphGeneration,
	EnvironmentVariable,
} from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const countries = introspect.graphql({
	apiNamespace: 'countries',
	url: 'https://countries.trevorblades.com/',
	headers(builder) {
		return builder.addClientRequestHeader('Authorization', 'Authorization');
	},
});

const oas = introspect.openApiV2({
	apiNamespace: 'oas',
	source: {
		kind: 'file',
		filePath: './union-types.yaml',
	},
	baseURL: new EnvironmentVariable('ONE_OF_URL', ''),
});

configureWunderGraphApplication({
	apis: [countries, oas],
	server,
	operations,
	options: {
		defaultRequestTimeoutSeconds: 2,
	},
	generate: configureWunderGraphGeneration({
		codeGenerators: [
			{
				templates: [...templates.typescript.all],
			},
		],
	}),
	experimental: {
		orm: true,
	},
});
