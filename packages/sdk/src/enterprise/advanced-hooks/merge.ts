/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Enterprise License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.ENTERPRISE.md
 */

import _ from 'lodash';

const graphQLMerger = (opts?: MergeOptions) => {
	const groupBy = opts?.groupBy;
	return (data: any, cur: any) => {
		const objMerger = (objValue: any, srcValue: any) => {
			if (_.isArray(objValue)) {
				return objValue.concat(srcValue);
			}
		};
		_.keys(cur).forEach((k) => {
			data[k] = _.concat(data[k] ?? [], cur[k]);
			if (groupBy !== undefined) {
				if (data[k].find((x: any) => x[groupBy] !== undefined)) {
					data[k] = data[k].reduce((acc: any[], cur: any) => {
						const prev = acc.find((x) => x[groupBy] === cur[groupBy]);
						if (prev) {
							_.mergeWith(prev, cur, objMerger);
						} else {
							acc.push(cur);
						}
						return acc;
					}, []);
				}
			}
		});
		return data;
	};
};

/**
 * Merges data from the given array of GraphQL responses. If any of the origins returns
 * an error, it returns the first error it encounters. The response headers will be
 * copied from the response of the first origin.
 * @param responses Array of responses
 * @param opts Options for performing the data merging
 * @returns Response with the merged data
 */
export const mergeGraphQLResponses = async (responses: Response[], opts?: MergeOptions): Promise<Response> => {
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
	const data = mergeGraphQLData(
		payloads.map((p) => p.data),
		opts
	);
	return new Response(JSON.stringify({ data }), responses[0]);
};

/**
 * Indicates how to merge the GraphQL data
 */
export interface MergeOptions {
	/**
	 * Optional key to group data by. If none of the elements in an array
	 * have this key, they're not merged so it can be used even if some
	 * arrays in the data have this key.
	 */
	groupBy?: string;
}

/**
 * Merges the data from several GraphQL responses according to opts
 * @param data Array of data fields from GraphQL responses
 * @param opts Options for performing the data merging
 * @returns Merged data
 */
export const mergeGraphQLData = (data: any[], opts?: MergeOptions): any => {
	const merger = graphQLMerger(opts);
	let merged: any = {};
	data.forEach((d) => {
		merged = merger(merged, d);
	});
	return merged;
};

/**
 * Sends a GraphQL request to multiple origins in parallel, merging their
 * data into a single response with mergeGraphQLResponses.
 *
 * @param request Original requests
 * @param origins List of origins to send the request too
 * @param opts Options for performing the data merging
 * @returns Merged GraphQL
 */
export const mergeGraphQLRequests = async (request: Request, origins: string[], opts?: MergeOptions) => {
	const requests: Request[] = [];
	const body = await request.text();
	for (const origin of origins) {
		const { cache, credentials, headers, integrity, method, mode, redirect, referrer, referrerPolicy } = request;

		requests.push(
			new Request(origin, {
				cache,
				credentials,
				headers,
				integrity,
				method,
				mode,
				redirect,
				referrer,
				referrerPolicy,
				body,
			})
		);
	}
	const responses = await Promise.all(requests.map((r) => fetch(r)));
	return mergeGraphQLResponses(responses, opts);
};
