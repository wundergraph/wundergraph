import { configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';
import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';

const weather = introspect.graphql({
	apiNamespace: 'weather',
	url: 'https://weather-api.wundergraph.com/',
});

const spaceX = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://spacex-api.fly.dev/graphql/',
});

const counter = introspect.graphql({
	id: 'counter',
	apiNamespace: 'ws',
	subscriptionsUseSSE: true,
	url: 'http://localhost:3003/api/graphql',
	loadSchemaFromString: `
			type Query {
				hello: String
			}

			type Subscription {
				countdown(from: Int!): Countdown!
			}

			type Countdown {
				countdown: Int!
				description: String!
			}
			
			schema {
				query: Query
				subscription: Subscription
			}`,
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [weather, spaceX, counter],
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
		allowedOrigins: ['http://localhost:3003'],
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production',
	},
});
