import { configureWunderGraphApplication, introspect } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';
import generate from './wundergraph.generate';

const countries = introspect.graphql({
	apiNamespace: 'countries',
	url: 'https://countries.trevorblades.com/',
});

const oas = introspect.openApiV2({
	source: {
		kind: 'file',
		filePath: './oas.yaml',
	},
	introspection: {
		disableCache: true,
	},
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [countries, oas],
	server,
	operations,
	generate,
	security: {
		enableGraphQLEndpoint: true,
	},
});
