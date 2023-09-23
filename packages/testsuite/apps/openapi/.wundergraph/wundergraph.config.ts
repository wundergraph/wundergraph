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
	schemaExtension: `
		type Reminder {
			id: Int
			date: Int
			time: Int
			what: String
		}

		type JSONData  {
			id: Int!
			name: String!
			date: Int!
		}
	`,
	replaceCustomScalarTypeFields: [
		{
			entityName: 'noteByID_200_response',
			fieldName: 'jsonData',
			responseTypeReplacement: '[JSONData]',
		},
		{
			entityName: 'Query',
			fieldName: 'reminders',
			responseTypeReplacement: '[Reminder]',
		},
	],
});

const unions = introspect.openApiV2({
	apiNamespace: 'unions',
	source: {
		kind: 'file',
		filePath: './union-types.yaml',
	},
	baseURL: new EnvironmentVariable('OPEN_API_INPUT_UNIONS_URL', ''),
});

// Only used to test retrieval of the spec via URL
const notesFromUrl = introspect.openApiV2({
	apiNamespace: 'notes_from_url',
	source: {
		kind: 'url',
		url: new EnvironmentVariable('NOTES_OPENAPI_URL', 'http://localhost:8091/api.yaml'),
	},
	introspection: {
		headers: (builder) => {
			builder.addStaticHeader('X-Foo', 'Bar');
			return builder;
		},
	},
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [notes, notesFromUrl, unions],
	server,
	operations,
	options: {
		defaultRequestTimeoutSeconds: 1,
	},
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
