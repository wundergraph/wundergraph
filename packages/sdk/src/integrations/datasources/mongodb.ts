import type { DatabaseIntrospection } from '../../definition';
import { defineDatasource } from '../define-datasource';

export interface MongoDBDatasourceOptions extends Omit<DatabaseIntrospection, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add a MongoDB database to your VirtualGraph.
 */
export const mongodb = defineDatasource<MongoDBDatasourceOptions>((config) => {
	const { namespace, ...introspectionConfig } = config;
	return {
		name: 'mongodb-datasource',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../../definition');
				options.addApi(
					introspect.mongodb({
						apiNamespace: namespace,
						...introspectionConfig,
					})
				);
			},
		},
	};
});
