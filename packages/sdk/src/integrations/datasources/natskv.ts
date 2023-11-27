import { NatsKVIntrospection } from '../../definition/nats-kv-introspection';
import { defineDatasource } from '../define-datasource';

export interface NatsKVDatasourceOptions extends Omit<NatsKVIntrospection, 'apiNamespace'> {
	namespace?: string;
}

/**
 * Add a Nats KV store to your VirtualGraph.
 */
export const natsKV = defineDatasource<NatsKVDatasourceOptions>((config) => {
	const { namespace = 'nats', ...introspectionConfig } = config;
	return {
		name: 'natskv-datasource',
		hooks: {
			'config:setup': async (options) => {
				const { introspect } = await import('../../definition');
				options.addApi(
					introspect.natsKV({
						apiNamespace: namespace,
						...introspectionConfig,
					})
				);
			},
		},
	};
});
