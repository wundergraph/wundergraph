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
	url: 'http://127.0.0.1:4000/graphql',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [counter],
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
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production' || process.env.GITPOD_WORKSPACE_ID !== undefined,
	},
});
