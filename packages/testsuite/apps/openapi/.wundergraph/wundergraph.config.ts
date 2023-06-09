import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const notes = introspect.openApiV2({
	id: 'notes',
	apiNamespace: 'notes',
	source: {
		kind: 'file',
		filePath: './api.yaml',
	},
	baseURL: new EnvironmentVariable('OPENAPI_URL', 'http://localhost:8090/'),
});

const unions = introspect.openApiV2({
	apiNamespace: 'unions',
	source: {
		kind: 'file',
		filePath: './union-types.yaml',
	},
	baseURL: new EnvironmentVariable('OPEN_API_INPUT_UNIONS_URL', ''),
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [notes, unions],
	server,
	operations,
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
				templates.typescript.operations,
				templates.typescript.linkBuilder,
				templates.typescript.client,
			],
			// create-react-app expects all code to be inside /src
			// path: "../frontend/src/generated",
		},
	],
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
