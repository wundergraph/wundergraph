import type { PrismaIntrospection } from '../../definition';
import { defineDatasource } from '../define-datasource';

export interface PrismaDatasourceOptions extends Omit<PrismaIntrospection, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add a Prisma database to your VirtualGraph.
 */
export const prisma = defineDatasource<PrismaDatasourceOptions>((config) => {
	const { namespace, ...introspectionConfig } = config;
	return {
		name: 'prisma-datasource',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../../definition');
				options.addApi(
					introspect.prisma({
						apiNamespace: namespace,
						...introspectionConfig,
					})
				);
			},
		},
	};
});
