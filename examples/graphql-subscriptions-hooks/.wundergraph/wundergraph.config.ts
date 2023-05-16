import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const schema = `
schema {
  query: Query
  subscription: Subscription
}

type Query {
  hello: String
}

type Subscription {
  countdown(from: Int!): Int!
}
`;

const counter = introspect.graphql({
	id: 'counter',
	apiNamespace: 'ws',
	loadSchemaFromString: schema,
	url: 'http://localhost:4000/graphql',
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
