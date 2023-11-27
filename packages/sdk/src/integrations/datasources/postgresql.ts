import type { DatabaseIntrospection } from '../../definition';
import { defineDatasource } from '../define-datasource';

export interface PostgreSQLDatasourceOptions extends Omit<DatabaseIntrospection, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add a Postgresql HTTP API to your VirtualGraph.
 */
export const postgresql = defineDatasource<PostgreSQLDatasourceOptions>((config) => {
	const { namespace, ...introspectionConfig } = config;
	return {
		name: 'postgresql-datasource',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../../definition');
				options.addApi(
					introspect.postgresql({
						apiNamespace: namespace,
						...introspectionConfig,
					})
				);
			},
		},
	};
});
