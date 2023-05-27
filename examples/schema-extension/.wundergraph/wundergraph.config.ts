import { configureWunderGraphApplication, cors, introspect } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const schema = `
schema {
  query: Query
}

type Query {
	images: [Image]
}

type Image {
	id: String!
	name: String!
	geography: Map!
}

scalar Map
`;

const gallery = introspect.graphql({
	apiNamespace: 'gallery',
	loadSchemaFromString: schema,
	url: 'http://localhost:8081/',
	schemaExtension: `
		type Geography {
		  latitude: Float
		  longitude: Float
		}
	`,
	customJSONScalars: ['Geography'],
	replaceCustomScalarTypeFields: [
		{
			entityName: 'Image',
			fieldName: 'geography',
			responseTypeReplacement: 'Geography',
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
	customJSONScalars: ['Contact', 'ContactInput'],
	replaceCustomScalarTypeFields: [
		{
			entityName: `users`,
			fieldName: `contact`,
			responseTypeReplacement: `Contact`,
			inputTypeReplacement: `ContactInput`,
		},
	],
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [gallery, db],
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
		enableGraphQLEndpoint: true,
	},
});
