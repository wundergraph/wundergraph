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

		console.log('WEATHER', await response.json());

		return {
			...response,
		};
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
	operations: {
		custom: {
			Weather: {
				caching: {
					enable: true,
				},
			},
		},
	},
	security: {
		enableGraphQLEndpoint: true,
	},
} satisfies WunderGraphConfig;
