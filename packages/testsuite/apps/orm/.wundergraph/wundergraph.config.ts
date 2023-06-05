import {
	configureWunderGraphApplication,
	introspect,
	templates,
	configureWunderGraphGeneration,
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

configureWunderGraphApplication({
	apis: [countries],
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
