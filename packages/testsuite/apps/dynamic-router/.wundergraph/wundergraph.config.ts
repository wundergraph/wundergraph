import type { WunderGraphConfig } from '@wundergraph/sdk';
import { graphql } from '@wundergraph/sdk/datasources';
import _ from 'lodash';

import { dynamicRouter, mergeGraphQLRequests } from '@wundergraph/sdk/dynamic-router';

import { url1, url2, url3 } from './datasources';

const router1 = dynamicRouter({
	match: {
		operationType: 'query',
		datasources: ['merged'],
	},

	handler: async ({ request }) => {
		return mergeGraphQLRequests(request, [url1, url2, url3], { groupBy: 'id' });
	},
});

const router2 = dynamicRouter({
	match: {
		operationType: 'query',
		datasources: ['faster'],
	},

	handler: async ({ request }) => {
		const data = await request.text();
		const p1 = fetch(
			new Request(url1, {
				method: request.method,
				headers: request.headers,
				body: data,
			})
		);
		const p2 = fetch(
			new Request(url2, {
				method: request.method,
				headers: request.headers,
				body: data,
			})
		);
		const p3 = fetch(
			new Request(url3, {
				method: request.method,
				headers: request.headers,
				body: data,
			})
		);
		const promises = [p1, p2, p3];
		// This would return the fast, but since all servers are in
		// localhost it's usually p1
		//return Promise.any(promises);
		// Return a random choice instead
		return promises[Math.floor(Math.random() * promises.length)];
	},
});

export default {
	datasources: [
		graphql({
			id: 'merged',
			namespace: '',
			url: url1,
		}),
		graphql({
			namespace: 'faster',
			url: url1,
		}),
		graphql({
			namespace: 'origin1',
			url: url1,
		}),
		graphql({
			namespace: 'origin2',
			url: url2,
		}),
		graphql({
			namespace: 'origin3',
			url: url3,
		}),
	],
	integrations: [router1, router2],
	operations: {
		defaultConfig: {
			authentication: {
				required: false,
			},
		},
		custom: {},
	},
	security: {
		enableGraphQLEndpoint: true,
	},
} satisfies WunderGraphConfig;
