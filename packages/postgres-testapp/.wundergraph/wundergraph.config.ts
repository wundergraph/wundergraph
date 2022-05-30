import { Application, configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const db = introspect.postgresql({
	apiNamespace: 'db',
	databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
});

const myApplication = new Application({
	name: 'app',
	apis: [db],
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	application: myApplication,
	server,
	operations,
	codeGenerators: [
		{
			templates: [...templates.typescript.all, templates.typescript.operations],
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
