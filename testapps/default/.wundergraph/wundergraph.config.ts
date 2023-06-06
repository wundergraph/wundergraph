import {
	authProviders,
	configureWunderGraphApplication,
	cors,
	EnvironmentVariable,
	introspect,
} from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';
import generate from './wundergraph.generate';

const jsp = introspect.openApiV2({
	id: 'jsp',
	apiNamespace: 'jsp',
	source: {
		kind: 'file',
		filePath: '../json_placeholder.json',
	},
});

const jsp2 = introspect.openApi({
	apiNamespace: 'jsp2',
	source: {
		kind: 'file',
		filePath: '../json_placeholder.json',
	},
	baseURL: new EnvironmentVariable('JSP_BASE_URL'),
});

const federationLocalUpstreams = [
	{
		url: 'http://localhost:4001/graphql',
	},
	{
		url: 'http://localhost:4003/graphql',
	},
	{
		url: 'http://localhost:4002/graphql',
	},
	{
		url: 'http://localhost:4004/graphql',
	},
];

const federationCloudUpstreams = [
	{
		url: 'https://wg-federation-demo-accounts.fly.dev/graphql',
	},
	{
		url: 'https://wg-federation-demo-products.fly.dev/graphql',
	},
	{
		url: 'https://wg-federation-demo-reviews.fly.dev/graphql',
	},
	{
		url: 'https://wg-federation-demo-inventory.fly.dev/graphql',
	},
];

const federatedApi = introspect.federation({
	apiNamespace: 'federated',
	upstreams: federationCloudUpstreams,
});

const spacex = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://spacex-api.fly.dev/graphql/',
	schemaExtension: `
	extend type Capsule {
		myCustomField: String
	}
	`,
	introspection: {
		disableCache: true,
	},
});

const countries = introspect.graphql({
	apiNamespace: 'countries',
	url: 'https://countries.trevorblades.com/',
});

const weather = introspect.graphql({
	id: 'weather',
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

const usersPost = introspect.prisma({
	apiNamespace: 'users_post',
	prismaFilePath: './schema.prisma',
	introspection: {
		disableCache: true,
	},
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [jsp, weather, countries, spacex, chinook, db, jsp2, usersPost, federatedApi],
	server,
	operations,
	generate,
	authorization: {
		roles: ['admin', 'user'],
	},
	experimental: {
		orm: true,
	},
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
