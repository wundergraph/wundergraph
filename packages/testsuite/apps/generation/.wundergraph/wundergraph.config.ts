import { EnvironmentVariable, configureWunderGraphApplication, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const countries = introspect.graphql({
	apiNamespace: 'countries',
	url: 'https://countries.trevorblades.com/',
	httpProxyUrl: new EnvironmentVariable('COUNTRIES_PROXY'),
});

const weather = introspect.graphql({
	apiNamespace: 'weather',
	url: 'https://weather-api.wundergraph.com/',
	introspection: {
		pollingIntervalSeconds: 5,
	},
	httpProxyUrl: new EnvironmentVariable('WEATHER_PROXY'),
});

configureWunderGraphApplication({
	apis: [countries, weather],
	server,
	operations,
	codeGenerators: [
		{
			templates: [...templates.typescript.all],
		},
	],
});
