import { Application, configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const schema = `
schema {
  query: Query
}

type Query {
	landpads(limit: Int, offset: Int): [Landpad]
	landpad(id: ID!): Landpad
}

scalar geography

type Landpad {
  attempted_landings: String
  details: String
  full_name: String
  id: ID
  landing_type: String
  location: geography
  status: String
  successful_landings: String
  wikipedia: String
}
`;

const spacex = introspect.graphql({
	apiNamespace: 'spacex',
	loadSchemaFromString: schema,
	url: 'https://spacex-api.fly.dev/graphql/',
	schemaExtension: `
		type Location {
		  latitude: Float
		  longitude: Float
		  name: String
		  region: String
		}
		input LocationInput {
		  latitude: Float
		  longitude: Float
		  name: String
		  region: String
		}
	`,
	replaceCustomScalarTypeFields: [
		{
			entityName: 'Landpad',
			fieldName: 'location',
			responseTypeReplacement: 'Location',
			inputTypeReplacement: 'LocationInput',
		},
	],
});

const db = introspect.postgresql({
	apiNamespace: 'db',
	databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
	schemaExtension: `
				type Contact {
					type: String
					phone: String
				}
				input ContactInput {
					type: String
					phone: String
				}
				`,
	replaceCustomScalarTypeFields: [
		{
			entityName: `users`,
			fieldName: `contact`,
			responseTypeReplacement: `Contact`,
			inputTypeReplacement: `ContactInput`,
		},
	],
});

const myApplication = new Application({
	name: 'app',
	apis: [spacex, db],
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	application: myApplication,
	server,
	operations,
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
				templates.typescript.operations,
				templates.typescript.linkBuilder,
			],
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins: [],
	},
	dotGraphQLConfig: {
		hasDotWunderGraphDirectory: false,
	},
	security: {
		enableGraphQLEndpoint: true,
	},
});
