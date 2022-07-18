import {
	Application,
	authProviders,
	configureWunderGraphApplication,
	cors,
	introspect,
	templates,
} from '@wundergraph/sdk';
import server from './wundergraph.server';
import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';
import operations from './wundergraph.operations';

const github = introspect.openApi({
	apiNamespace: 'github',
	source: {
		kind: 'file',
		filePath: './github_openapi.json',
	},
	// This generates GraphQL union for HTTP response status codes
	statusCodeUnions: true,
	headers: (builders) => builders.addClientRequestHeader('Authorization', 'Authorization'),
});

const spaceX = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://api.spacex.land/graphql/',
});

const myApplication = new Application({
	name: 'api',
	apis: [spaceX, github],
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	application: myApplication,
	server,
	operations,
	codeGenerators: [
		{
			templates: [...templates.typescript.all, templates.typescript.operations, templates.typescript.linkBuilder],
		},
		{
			templates: [new NextJsTemplate()],
			path: '../components/generated',
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins: process.env.NODE_ENV === 'production' ? ['http://localhost:3000'] : ['http://localhost:3000'],
	},
	authorization: {
		roles: [
			// All roles are available as GraphQL enum
			'stargazer',
			'admin',
			'user',
		],
	},
	authentication: {
		cookieBased: {
			// This is just an example and uses our Github Application
			providers: [authProviders.demo()],
			authorizedRedirectUris: ['http://localhost:3000/authentication'],
		},
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production',
	},
});
