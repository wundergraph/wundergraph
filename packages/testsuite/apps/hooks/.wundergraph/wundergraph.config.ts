import { configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const countries = introspect.graphql({
	apiNamespace: 'countries',
	url: 'https://countries.trevorblades.com/',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [countries],
	server,
	operations,
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
			],
			// create-react-app expects all code to be inside /src
			// path: "../frontend/src/generated",
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins: ['http://localhost:9991', 'http://127.0.0.1:9991'],
	},
	security: {
		enableGraphQLEndpoint: true,
	},
});
