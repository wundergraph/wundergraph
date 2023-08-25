import type { GraphQLIntrospection } from '../../definition';
import { defineDatasource } from '../define-datasource';

export interface GraphQLDatasourceOptions extends Omit<GraphQLIntrospection, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add a GraphQL API to your VirtualGraph.
 */
export const graphql = defineDatasource<GraphQLDatasourceOptions>((config) => {
	const { namespace, ...introspectionConfig } = config;
	return {
		name: 'graphql-datasource',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../../definition');
				options.addApi(
					introspect.graphql({
						apiNamespace: namespace,
						...introspectionConfig,
					})
				);
			},
		},
	};
});
