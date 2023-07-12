import type { WunderGraphConfig } from '@wundergraph/sdk';
import { graphql } from '@wundergraph/sdk/integrations';
import { weather } from './weather-datasource';

import { dynamicRouter } from '@wundergraph/sdk/dynamic-router';

const batcher = dynamicRouter({
	match: {
		operationType: 'query',
		datasources: ['weather'],
	},

	handler: ({ request }) => {
		return fetch(request);
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
	options: {
		openTelemetry: {
			enabled: true,
		},
		prometheus: {
			enabled: true,
		},
	},
} satisfies WunderGraphConfig;
