import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const stripe = introspect.openApiV2({
	id: 'stripe',
	baseURL: 'http://localhost:12111',
	apiNamespace: 'stripe',
	source: {
		kind: 'file',
		filePath: './stripe.yaml',
	},
	headers: (builder) =>
		builder
			.addClientRequestHeader('X-Authorization', 'FooBarBazz')
			.addStaticHeader('Authorization', `Bearer sk_test_123`),
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [stripe],
	server,
	operations,
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
			],
			// create-react-app expects all code to be inside /src
			// path: "../frontend/src/generated",
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins: ['http://localhost:9991', 'http://127.0.0.1:9991'],
	},
	dotGraphQLConfig: {
		hasDotWunderGraphDirectory: false,
	},
	security: {
		enableGraphQLEndpoint: true,
	},
});
