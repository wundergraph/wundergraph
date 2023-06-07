import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const weather = introspect.graphql({
	apiNamespace: 'weather',
	url: 'https://weather-api.wundergraph.com/',
	introspection: {
		pollingIntervalSeconds: 5,
	},
});

const spacex = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://spacex-api.fly.dev/graphql/',
	schemaExtension: `
	extend type Capsule {
		myCustomField: String
	}
	`,
	introspection: {
		disableCache: true,
	},
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [weather, spacex],
	server,
	operations,
	cors: {
		...cors.allowAll,
		allowedOrigins:
			process.env.NODE_ENV === 'production'
				? [
						// change this before deploying to production to the actual domain where you're deploying your app
						'http://localhost:3000',
				  ]
				: ['http://localhost:3000'],
	},
	options: {
		openTelemetry: {
			enabled: true,
			sampler: 1,
			exporterHttpEndpoint: new EnvironmentVariable('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318'),
		},
	},
	security: {
		enableGraphQLEndpoint: true,
	},
});
