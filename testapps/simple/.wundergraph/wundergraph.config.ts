import type { WunderGraphConfig } from '@wundergraph/sdk';
import { graphql } from '@wundergraph/sdk/integrations';
import { weather } from './weather-datasource';

import { dynamicRouter } from '@wundergraph/sdk/dynamic-router';

const batcher = dynamicRouter({
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
	datasources: [
		weather(),
		graphql({
			namespace: 'countries',
			url: 'https://countries.trevorblades.com/',
		}),
		graphql({
			namespace: 'countries',
			url: 'https://countries.trevorblades.com/',
		}),
	],
	integrations: [batcher],
	security: {
		enableGraphQLEndpoint: true,
	},
} satisfies WunderGraphConfig;
