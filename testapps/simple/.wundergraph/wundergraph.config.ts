import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const weather = introspect.graphql({
	apiNamespace: 'weather',
	url: 'https://weather-api.wundergraph.com/',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [weather],
	server,
	operations,
	options: {
		openTelemetry: {
			enabled: true,
			authToken: '123',
		},
		prometheus: {
			enabled: true,
		},
	},
});
