import { defineConfig } from '@wundergraph/sdk';
import { graphql } from '@wundergraph/sdk/integrations';
import { weather } from './weather-integration';

export default defineConfig({
	integrations: [
		weather(),
		graphql({
			apiNamespace: 'countries',
			url: 'https://countries.trevorblades.com/',
		}),
		{
			name: 'countries',
			hooks: {
				'hooks:queries:preResolve': async (context) => {
					console.log('preResolve hook for countries', context);
				},
			},
		},
		// addUpstreamHeaders({
		// 	match: [{
		// 		namespace: 'countries',
		// 	}]
		// }),
		// yoga({
		// 	namespace: 'yoga',
		// 	port: 4000,
		// 	schema: ...
		// }),
	],
});
