import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const db = introspect.postgresql({
	apiNamespace: 'db',
	databaseURL: new EnvironmentVariable('DATABASE_URL'),
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [db],
	server,
	operations,
	generate: {
		codeGenerators: [],
	},
	cors: {
		...cors.allowAll,
		allowedOrigins: ['http://localhost:3000'],
	},
	security: {
		enableGraphQLEndpoint: true,
	},
});
