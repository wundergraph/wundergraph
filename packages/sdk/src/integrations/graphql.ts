import type { GraphQLIntrospection } from '../definition';
import { defineDatasource } from './define-datasource';

export interface GraphQLDatasourceOptions extends Omit<GraphQLIntrospection, 'apiNamespace'> {
	namespace: string;
}

export const graphql = defineDatasource<GraphQLDatasourceOptions>((config) => {
	return {
		name: 'graphql',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../definition');
				options.addApi(
					introspect.graphql({
						apiNamespace: config.namespace,
						...config,
					})
				);
			},
		},
	};
});
