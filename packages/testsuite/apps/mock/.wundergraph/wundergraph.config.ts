import {
	EnvironmentVariable,
	configureWunderGraphApplication,
	introspect,
	templates,
	configureWunderGraphGeneration,
} from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const weather = introspect.graphql({
	id: 'weather',
	apiNamespace: 'weather',
	url: new EnvironmentVariable('WEATHER_URL', 'https://weather-api.wundergraph.com/'),
	introspection: {
		pollingIntervalSeconds: 5,
	},
});

const countries = introspect.graphql({
	apiNamespace: 'countries',
	url: new EnvironmentVariable('COUNTRIES_URL', 'https://countries.trevorblades.com/'),
});

configureWunderGraphApplication({
	apis: [countries, weather],
	server,
	operations,
	generate: configureWunderGraphGeneration({
		codeGenerators: [
			{
				templates: [...templates.typescript.all],
			},
		],
	}),
});
