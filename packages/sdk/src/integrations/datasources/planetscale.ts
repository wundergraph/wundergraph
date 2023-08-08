import type { DatabaseIntrospection } from '../../definition';
import { defineDatasource } from '../define-datasource';

export interface PlanetScaleDatasourceOptions extends Omit<DatabaseIntrospection, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add a Planetscale HTTP API to your VirtualGraph.
 */
export const planetscale = defineDatasource<PlanetScaleDatasourceOptions>((config) => {
	const { namespace, ...introspectionConfig } = config;
	return {
		name: 'planetscale-datasource',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../../definition');
				options.addApi(
					introspect.planetscale({
						apiNamespace: namespace,
						...introspectionConfig,
					})
				);
			},
		},
	};
});
