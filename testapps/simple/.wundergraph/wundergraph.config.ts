import type { WunderGraphConfig } from '@wundergraph/sdk';
import { graphql } from '@wundergraph/sdk/integrations';
import { weather } from './weather-integration';

/**
 * By simple annotating the export using WunderGraphConfig,
 * We can safely import this into the server without having to
 * import the SDK. Ideally we would support defineConfig, but
 * that would require a lot of work (and breaking changes) to get right.
 */
// export default defineConfig({
export default {
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
} as WunderGraphConfig;
