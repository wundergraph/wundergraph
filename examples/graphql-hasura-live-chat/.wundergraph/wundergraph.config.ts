import {
	authProviders,
	configureWunderGraphApplication,
	cors,
	introspect,
	templates,
	EnvironmentVariable,
} from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const hasura = introspect.graphql({
	id: 'hasura',
	apiNamespace: 'hasura',
	url: 'http://hasura-engine:8080/v1/graphql',
	headers: (builder) =>
		builder
			.addClientRequestHeader('Authorization', 'Authorization')
			// .addClientRequestHeader('x-hasura-admin-secret', 'x-hasura-admin-secret'),
			.addStaticHeader('x-hasura-admin-secret', new EnvironmentVariable('HASURA_GRAPHQL_ADMIN_SECRET')),
	introspection: {
		pollingIntervalSeconds: 60,
		headers: (builder) =>
			builder.addStaticHeader('x-hasura-admin-secret', new EnvironmentVariable('HASURA_GRAPHQL_ADMIN_SECRET')),
	},
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [hasura],
	server,
	operations,
	codeGenerators: [
		{
			templates: [...templates.typescript.all],
		},
		{
			templates: [templates.typescript.client],
			path: '../components/generated',
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins: ['http://localhost:3000'],
	},
	authentication: {
		cookieBased: {
			providers: [authProviders.demo()],
			authorizedRedirectUriRegexes: ['http://localhost:3000*'],
		},
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production',
	},
	options: {
		listen: {
			host: '0.0.0.0',
			port: '9991',
		},
	},
});
