import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const countries = introspect.graphql({
	apiNamespace: 'countries',
	url: 'https://countries.trevorblades.com/graphql',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [countries],
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
		allowedOrigins: ['http://localhost:3000'],
	},
	authentication: {
		tokenBased: {
			providers: [
				{
					jwksURL: new EnvironmentVariable('CLERK_JWKS_URL'),
				},
			],
		},
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production',
	},
});
