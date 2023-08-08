/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Community License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.COMMUNITY.md
 */

import type { GraphQLFederationIntrospection } from '../../definition';
import { defineDatasource } from '../define-datasource';

export interface FederationDatasourceOptions extends Omit<GraphQLFederationIntrospection, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add a Federated GraphQL API to your VirtualGraph.
 *
 * @license "WunderGraph Community License"
 */
export const federation = defineDatasource<FederationDatasourceOptions>((config) => {
	const { namespace, ...introspectionConfig } = config;
	return {
		name: 'federation-datasource',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../../definition');
				options.addApi(
					introspect.federation({
						apiNamespace: namespace,
						...introspectionConfig,
					})
				);
			},
		},
	};
});
