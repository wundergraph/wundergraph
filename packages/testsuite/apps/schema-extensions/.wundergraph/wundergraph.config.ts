import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const pocket = introspect.graphql({
	apiNamespace: 'pocket',
	url: 'http://0.0.0.0:4000/graphql',
	schemaExtension: `
	type Details {
			name: String
			age: Int
	}
	type TeamData {
			highestLevel: Int
			typeSpeciality: String
	}
	`,
	customJSONScalars: ['Details', 'TeamData'],
	replaceCustomScalarTypeFields: [
		{
			entityName: 'GymLeader',
			fieldName: 'details',
			responseTypeReplacement: 'Details',
		},
		{
			entityName: 'GymLeader',
			fieldName: 'teamData',
			responseTypeReplacement: 'TeamData',
		},
		{
			entityName: 'Rival',
			fieldName: 'details',
			responseTypeReplacement: 'Details',
		},
		{
			entityName: 'Rival',
			fieldName: 'teamData',
			responseTypeReplacement: 'TeamData',
		},
		{
			entityName: 'Friend',
			fieldName: 'details',
			responseTypeReplacement: 'Details',
		},
	],
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [pocket],
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
