/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Community License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.COMMUNITY.md
 */

//language=handlebars
export const handlebarTemplate = `
import { DATA_SOURCES } from './wundergraph.hooks'

declare module '@wundergraph/sdk/advanced-hooks' {
	export interface RouteMatcher {
		datasources?: DATA_SOURCES[]
	}
}
`;
