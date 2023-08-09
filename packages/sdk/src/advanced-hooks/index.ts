/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Enterprise License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.ENTERPRISE.md
 */

export {
	type DynamicTransportConfig,
	type DynamicTransportContext,
	type RouteMatcher,
	dynamicTransport,
} from './http-transport';
export { mergeGraphQLRequests, mergeGraphQLResponses } from './merge';
