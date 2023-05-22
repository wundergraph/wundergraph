import { defineConfig } from '@wundergraph/sdk';
import { graphql } from '@wundergraph/sdk/integrations';
import { weather } from './weather-integration';

export default defineConfig({
	integrations: [
		graphql({
			apiNamespace: 'countries',
			url: 'https://countries.trevorblades.com/',
		}),
		weather(),
	],
});
