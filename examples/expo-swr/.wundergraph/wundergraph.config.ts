import { configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const spaceX = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://spacex-api.fly.dev/graphql/',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [
		spaceX,
		/*federatedApi,
        openAPI,
        graphQLAPI*/
	],
	server,
	operations,
	generate: {
		codeGenerators: [
			{
				templates: [templates.typescript.client],
				path: '../generated',
			},
		],
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
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production',
	},
});
