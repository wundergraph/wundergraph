import {
	authProviders,
	configureWunderGraphApplication,
	cors,
	EnvironmentVariable,
	introspect,
	templates,
} from '@wundergraph/sdk';
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
		allowedOrigins: ['http://localhost:3003'],
	},
	authentication: {
		cookieBased: {
			providers: [
				authProviders.demo(),
				authProviders.openIdConnect({
					id: 'kc',
					issuer: new EnvironmentVariable('AUTH_ISSUER'),
					clientId: new EnvironmentVariable('AUTH_CLIENT_ID'),
					clientSecret: new EnvironmentVariable('AUTH_CLIENT_SECRET'),
					queryParameters: [{ name: 'kc_idp_hint', value: 'github' }],
				}),
			],
			authorizedRedirectUris: ['http://localhost:3003'],
		},
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production',
	},
});
