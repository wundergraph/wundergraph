import type { DatabaseIntrospection } from '../../definition';
import { defineDatasource } from '../define-datasource';

export interface MySQLDatasourceOptions extends Omit<DatabaseIntrospection, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add a MySQL database to your VirtualGraph.
 */
export const mysql = defineDatasource<MySQLDatasourceOptions>((config) => {
	const { namespace, ...introspectionConfig } = config;
	return {
		name: 'mysql-datasource',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../../definition');
				options.addApi(
					introspect.mysql({
						apiNamespace: namespace,
						...introspectionConfig,
					})
				);
			},
		},
	};
});
