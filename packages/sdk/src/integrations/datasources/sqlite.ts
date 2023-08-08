import type { DatabaseIntrospection } from '../../definition';
import { defineDatasource } from '../define-datasource';

export interface SQLiteDatasourceOptions extends Omit<DatabaseIntrospection, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add a SQLite database to your VirtualGraph.
 */
export const sqlite = defineDatasource<SQLiteDatasourceOptions>((config) => {
	const { namespace, ...introspectionConfig } = config;
	return {
		name: 'openapi-datasource',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../../definition');
				options.addApi(
					introspect.sqlite({
						apiNamespace: namespace,
						...introspectionConfig,
					})
				);
			},
		},
	};
});
