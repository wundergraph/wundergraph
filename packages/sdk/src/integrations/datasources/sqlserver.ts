import type { DatabaseIntrospection } from '../../definition';
import { defineDatasource } from '../define-datasource';

export interface SQLServerDatasourceOptions extends Omit<DatabaseIntrospection, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add a SQLServer database to your VirtualGraph.
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
