import { authProviders, configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const spaceX = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://spacex-api.fly.dev/graphql/',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [spaceX],
	server,
	operations,
	generate: {
		codeGenerators: [
			{
				templates: [templates.typescript.client],
				path: './components/generated',
			},
		],
	},
	cors: {
		...cors.allowAll,
		allowedOrigins: process.env.NODE_ENV === 'production' ? ['https://*'] : ['http://*'],
		/**
		 * Please configure CORS carefully to make sure that your users are protected.
		 * Allowing all origins is usually the worst possible configuration.
		 *
		 * @docs https://docs.wundergraph.com/docs/wundergraph-config-ts-reference/configure-cors
		 */
		// allowedOrigins: process.env.NODE_ENV === 'production' ? ['http://your.app'] : ['http://localhost:3000'],
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
