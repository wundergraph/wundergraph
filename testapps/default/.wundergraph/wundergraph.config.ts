import {
	authProviders,
	configureWunderGraphApplication,
	cors,
	EnvironmentVariable,
	introspect,
	templates,
} from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';
import { golangClient } from '@wundergraph/golang-client';

const jsp = introspect.openApi({
	apiNamespace: 'jsp',
	source: {
		kind: 'file',
		filePath: '../json_placeholder.json',
	},
	baseURL: 'https://jsonplaceholder.typicode.{tld}',
	headers: (builder) => builder.addClientRequestHeader('X-Authorization', 'Authorization'),
});

const jsp2 = introspect.openApi({
	apiNamespace: 'jsp2',
	source: {
		kind: 'file',
		filePath: '../json_placeholder.json',
	},
	baseURL: new EnvironmentVariable('JSP_BASE_URL'),
	headers: (builder) => builder.addClientRequestHeader('X-Authorization', 'Authorization'),
});

/*const federatedApi = introspect.federation({
	apiNamespace: 'federated',
	upstreams: [
		{
			url: 'http://localhost:4001/graphql',
		},
		{
			url: 'http://localhost:4002/graphql',
		},
		{
			url: 'http://localhost:4003/graphql',
		},
		{
			url: 'http://localhost:4004/graphql',
		},
	],
});*/

const spacex = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://spacex-api.fly.dev/graphql/',
});

const countries = introspect.graphql({
	apiNamespace: 'countries',
	url: 'https://countries.trevorblades.com/',
});

const weather = introspect.graphql({
	apiNamespace: 'weather',
	url: 'https://weather-api.wundergraph.com/',
	introspection: {
		pollingIntervalSeconds: 5,
	},
});

const chinook = introspect.sqlite({
	apiNamespace: 'chinook',
	databaseURL: 'file:./Chinook.sqlite',
});

const db = introspect.sqlite({
	apiNamespace: 'db',
	databaseURL: 'file:./db.sqlite',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [jsp, weather, countries, spacex, chinook, db, jsp2],
	server,
	operations,
	authorization: {
		roles: ['admin', 'user'],
	},
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
			],
		},
		{
			templates: [
				...golangClient.all({
					packageName: 'client',
				}),
			],
			path: './generated/golang/client',
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins:
			process.env.NODE_ENV === 'production'
				? [
						// change this before deploying to production to the actual domain where you're deploying your app
						'http://localhost:3000',
				  ]
				: ['http://localhost:3000'],
	},
	authentication: {
		cookieBased: {
			providers: [authProviders.demo()],
			authorizedRedirectUris: ['http://localhost:3000'],
		},
	},
	security: {
		enableGraphQLEndpoint: true,
	},
});
