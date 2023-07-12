import type { WunderGraphConfig } from '@wundergraph/sdk';
import { graphql } from '@wundergraph/sdk/integrations';
import { weather } from './weather-integration';

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
	integrations: [
		weather(),
		graphql({
			apiNamespace: 'countries',
			url: 'https://countries.trevorblades.com/',
		}),
		batcher,
	],
	options: {
		openTelemetry: {
			enabled: true,
		},
		prometheus: {
			enabled: true,
		},
	},
} satisfies WunderGraphConfig;
