import {
	Application,
	authProviders,
	configureWunderGraphApplication,
	cors,
	introspect,
	templates,
} from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';
import { golangClient } from '@wundergraph/golang-client';

const spaceX = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://api.spacex.land/graphql/',
	introspection: {
		pollingIntervalSeconds: 5,
	},
});

const jsp = introspect.openApi({
	apiNamespace: 'jsp',
	source: {
		kind: 'file',
		filePath: '../json_placeholder.json',
	},
	introspection: {
		pollingIntervalSeconds: 2,
	},
});

const countries = introspect.graphql({
	apiNamespace: 'countries',
	url: 'https://countries.trevorblades.com/',
});

const weather = introspect.graphql({
	apiNamespace: 'weather',
	url: 'https://graphql-weather-api.herokuapp.com/',
});

const federatedApi = introspect.federation({
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
});

const myApplication = new Application({
	name: 'app',
	apis: [spaceX, jsp, weather, countries, federatedApi],
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	application: myApplication,
	server,
	operations,
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
				templates.typescript.operations,
				templates.typescript.linkBuilder,
			],
		},
		{
			templates: [...golangClient.all({ packageName: 'client' })],
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
	dotGraphQLConfig: {
		hasDotWunderGraphDirectory: false,
	},
});
