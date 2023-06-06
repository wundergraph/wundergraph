import { authProviders, configureWunderGraphApplication, cors, introspect } from '@wundergraph/sdk';
import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

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

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [federatedApi],
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
