import { configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
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
		enableGraphQLEndpoint: true,
	},
});
