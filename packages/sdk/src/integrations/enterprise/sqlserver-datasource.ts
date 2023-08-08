/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Community License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.COMMUNITY.md
 */

import type { DatabaseIntrospection } from '../../definition';
import { defineDatasource } from '../define-datasource';

export interface SQLServerDatasourceOptions extends Omit<DatabaseIntrospection, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add a SQLServer database to your VirtualGraph.
 *
 * @license "WunderGraph Community License"
 */
export const sqlserver = defineDatasource<SQLServerDatasourceOptions>((config) => {
	const { namespace, ...introspectionConfig } = config;
	return {
		name: 'sqlserver-datasource',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../../definition');
				options.addApi(
					introspect.sqlserver({
						apiNamespace: namespace,
						...introspectionConfig,
					})
				);
			},
		},
	};
});
