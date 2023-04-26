import {
	EnvironmentVariable,
	configureWunderGraphApplication,
	introspect,
	templates,
	configureWunderGraphGeneration,
} from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const countries = introspect.graphql({
	apiNamespace: 'countries',
	url: new EnvironmentVariable('COUNTRIES_URL', 'https://countries.trevorblades.com/'),
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
});
