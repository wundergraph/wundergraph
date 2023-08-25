import type { WunderGraphConfig } from '@wundergraph/sdk';
import { graphql } from '@wundergraph/sdk/datasources';
import { dynamicTransport } from '@wundergraph/sdk/advanced-hooks';

import { weather } from './weather-datasource';

const router = dynamicTransport({
	match: {
		operationType: 'query',
		datasources: ['weather'],
	},
	handler: async ({ request }) => {
		const response = await fetch(request);

		const { data } = await response.json();

		data.weather_getCityByName.name = 'Override';

		console.log('WEATHER', data);

		return new Response(JSON.stringify({ data }));
	},
});

export default {
	experimental: {
		orm: true,
	},
	datasources: [
		weather(),
		graphql({
			namespace: 'countries',
			url: 'https://countries.trevorblades.com/',
		}),
	],
	integrations: [router],
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production',
	},
} satisfies WunderGraphConfig;
