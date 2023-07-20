import type { WunderGraphConfig } from '@wundergraph/sdk';
import { graphql } from '@wundergraph/sdk/datasources';
import _ from 'lodash';

import { dynamicTransport } from '@wundergraph/sdk/advanced-hooks';

import { url1, url2, url3 } from './datasources';

type DataMerger = (prev: any, cur: any) => any;

const mergeGraphQLResponses = async (responses: Response[], merger: DataMerger): Promise<Response> => {
	// If any of the responses has a non-200 status code, return it
	const failed = responses.find((r) => r.status !== 200);
	if (failed) {
		return failed;
	}
	// Merge the data in the responses
	const payloads = await Promise.all(responses.map((r) => r.json()));
	// If any response has a GraphQL error, return it
	const errorIndex = payloads.findIndex((p) => p.error !== undefined);
	if (errorIndex >= 0) {
		return new Response(JSON.stringify(payloads[errorIndex]), responses[errorIndex]);
	}
	let data: any = {};
	payloads.forEach((p) => {
		const payloadData = p.data;
		data = merger(data, payloadData);
	});
	return new Response(JSON.stringify({ data }), responses[0]);
};

const graphQLMerger = (data: any, cur: any) => {
	const objMerger = (objValue: any, srcValue: any) => {
		if (_.isArray(objValue)) {
			return objValue.concat(srcValue);
		}
	};
	_.keys(cur).forEach((k) => {
		data[k] = _.concat(data[k] ?? [], cur[k]);
		if (data[k].find((x: any) => x.id !== undefined)) {
			data[k] = data[k].reduce((acc: any[], cur: any) => {
				const prev = acc.find((x) => x.id === cur.id);
				if (prev) {
					_.mergeWith(prev, cur, objMerger);
				} else {
					acc.push(cur);
				}
				return acc;
			}, []);
		}
	});
	return data;
};

const router1 = dynamicTransport({
	match: {
		operationType: 'query',
		datasources: ['merged'],
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
		const responses = await Promise.all([p1, p2, p3]);
		return mergeGraphQLResponses(responses, graphQLMerger);
	},
});

const router2 = dynamicTransport({
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
