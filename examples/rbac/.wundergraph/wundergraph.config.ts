import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';
import { authProviders, configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import operations from './wundergraph.operations';
import server from './wundergraph.server';

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
	url: 'https://spacex-api.fly.dev/graphql/',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [spaceX, github],
	server,
	operations,
	generate: {
		codeGenerators: [
			{
				templates: [new NextJsTemplate()],
				path: '../components/generated',
			},
		],
	},
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
