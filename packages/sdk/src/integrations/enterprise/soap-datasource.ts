/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Community License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.COMMUNITY.md
 */

import type { SoapIntrospection } from '../../definition/soap-introspection';
import { defineDatasource } from '../define-datasource';

export interface SoapDatasourceOptions extends Omit<SoapIntrospection, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add a SOAP API to your VirtualGraph.
 *
 * @license "WunderGraph Community License"
 */
export const soap = defineDatasource<SoapDatasourceOptions>((config) => {
	const { namespace, ...introspectionConfig } = config;
	return {
		name: 'soap-datasource',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../../definition');
				options.addApi(
					introspect.soap({
						apiNamespace: namespace,
						...introspectionConfig,
					})
				);
			},
		},
	};
});
