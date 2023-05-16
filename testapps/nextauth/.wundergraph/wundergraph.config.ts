import { configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const spaceX = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://spacex-api.fly.dev/graphql/',
});

const gql = introspect.graphql({
	apiNamespace: 'gql',
	url: 'http://localhost:3000/api/graphql',
	loadSchemaFromString() {
		return `
			type Query {
				hello: String!
			}
			type Mutation {
				setName(name: String!): String!
			}
		`;
	},
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [spaceX, gql],
	server,
	operations,
	generate: {
		codeGenerators: [
			{
				templates: [new NextJsTemplate()],
				path: '../components/generated',
			},
		],
	},
	cors: {
		...cors.allowAll,
		allowedOrigins: process.env.NODE_ENV === 'production' ? ['http://localhost:3000'] : ['http://localhost:3000'],
	},
	authentication: {
		tokenBased: {
			providers: [
				{
					userInfoEndpoint: 'http://localhost:3000/api/auth/userInfo',
				},
			],
		},
		cookieBased: {
			providers: [],
		},
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production',
	},
});
