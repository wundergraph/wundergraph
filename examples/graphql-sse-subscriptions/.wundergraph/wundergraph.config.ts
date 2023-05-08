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
  greetings: String
}
`;

const greetings = introspect.graphql({
	apiNamespace: 'sse',
	url: 'http://localhost:4000/graphql/stream',
	loadSchemaFromString: schema,
	subscriptionsUseSSE: true,
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [greetings],
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
