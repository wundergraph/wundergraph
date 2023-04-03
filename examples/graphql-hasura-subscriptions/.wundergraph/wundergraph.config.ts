import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const hasura = introspect.graphql({
	apiNamespace: 'hasura',
	url: 'https://hasura.io/learn/graphql',
	headers: (builder) => builder.addStaticHeader('Authorization', new EnvironmentVariable('HASURA_AUTH_TOKEN')),
});
// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [hasura],
	server,
	operations,
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
			],
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins: [],
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production' || process.env.GITPOD_WORKSPACE_ID !== undefined,
	},
});
