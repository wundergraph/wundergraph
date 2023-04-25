import { EnvironmentVariable, configureWunderGraphApplication, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const countries = introspect.graphql({
	apiNamespace: 'countries',
	url: new EnvironmentVariable('COUNTRIES_URL', 'https://countries.trevorblades.com/'),
	httpProxyUrl: new EnvironmentVariable('COUNTRIES_PROXY'),
});

configureWunderGraphApplication({
	apis: [countries],
	server,
	operations,
	options: {
		defaultRequestTimeoutSeconds: 2,
	},
	generate: {
		codeGenerators: [
			{
				templates: [...templates.typescript.all],
			},
		],
	},
});
