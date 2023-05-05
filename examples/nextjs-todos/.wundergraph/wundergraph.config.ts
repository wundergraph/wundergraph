import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';
import { authProviders, configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import operations from './wundergraph.operations';
import server from './wundergraph.server';

const db = introspect.postgresql({
	apiNamespace: 'db',
	databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
	introspection: {
		disableCache: true,
	},
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [db],
	server,
	operations,
	generate: {
		codeGenerators: [
			{
				templates: [templates.typescript.operations, templates.typescript.linkBuilder],
			},
			{
				templates: [templates.typescript.client, new NextJsTemplate()],
				path: '../components/generated',
			},
		],
	},
	cors: {
		...cors.allowAll,
		allowedOrigins: process.env.NODE_ENV === 'production' ? ['http://localhost:3000'] : ['http://localhost:3000'],
	},
	authentication: {
		cookieBased: {
			providers: [authProviders.demo()],
			authorizedRedirectUris: ['http://localhost:3000'],
		},
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production',
	},
});
