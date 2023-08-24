/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Community License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.COMMUNITY.md
 */

export {
	type DynamicTransportOptions,
	type DynamicTransportContext,
	type RouteMatcher,
	dynamicTransport,
} from './http-transport';
export { mergeGraphQLRequests, mergeGraphQLResponses } from './merge';
