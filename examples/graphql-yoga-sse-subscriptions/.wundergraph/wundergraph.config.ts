import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const counter = introspect.graphql({
	apiNamespace: 'counter',
	url: 'http://localhost:4000/graphql',
	subscriptionsUseSSE: true,
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [counter],
	server,
	operations,
	generate: {
		codeGenerators: [],
	},
	cors: {
		...cors.allowAll,
		allowedOrigins: [],
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production' || process.env.GITPOD_WORKSPACE_ID !== undefined,
	},
});
