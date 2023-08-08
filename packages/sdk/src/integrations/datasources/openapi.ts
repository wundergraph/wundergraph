import type { OpenAPIIntrospectionV2 } from '../../definition/openapi-introspection';
import { defineDatasource } from '../define-datasource';

export interface OpenAPIDatasourceOptions extends Omit<OpenAPIIntrospectionV2, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add an OpenAPI API to your VirtualGraph.
 */
export const openapi = defineDatasource<OpenAPIDatasourceOptions>((config) => {
	const { namespace, ...introspectionConfig } = config;
	return {
		name: 'openapi-datasource',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../../definition');
				options.addApi(
					introspect.openApiV2({
						apiNamespace: namespace,
						...introspectionConfig,
					})
				);
			},
		},
	};
});
