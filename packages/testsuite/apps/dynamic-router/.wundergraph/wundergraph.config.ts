import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';
import { url1, url2, url3 } from './datasources';

const s1 = introspect.graphql({
	apiNamespace: 's1',
	url: url1,
});

const s2 = introspect.graphql({
	apiNamespace: 's2',
	url: url2,
});

const s3 = introspect.graphql({
	apiNamespace: 's3',
	url: url3,
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [s1, s2, s3],
	server,
	operations,
	generate: {
		codeGenerators: [],
	},
	cors: {
		...cors.allowAll,
		allowedOrigins:
			process.env.NODE_ENV === 'production'
				? [
						// change this before deploying to production to the actual domain where you're deploying your app
						'http://localhost:3000',
				  ]
				: ['http://localhost:3000', new EnvironmentVariable('WG_ALLOWED_ORIGIN')],
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production' || process.env.GITPOD_WORKSPACE_ID !== undefined,
	},
});
