import { configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const db = introspect.postgresql({
	apiNamespace: 'db',
	databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [db],
	server,
	operations,
	codeGenerators: [
		{
			templates: [...templates.typescript.all],
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins: ['http://localhost:3000'],
	},
	dotGraphQLConfig: {
		hasDotWunderGraphDirectory: false,
	},
	security: {
		enableGraphQLEndpoint: true,
	},
});
