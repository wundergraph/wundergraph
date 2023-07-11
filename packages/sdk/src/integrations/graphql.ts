import type { GraphQLIntrospection } from '../definition';

export interface GraphQLIntegration extends GraphQLIntrospection {}

export const graphql = (config: GraphQLIntegration) => {
	return {
		name: 'graphql',
		hooks: {
			'config:setup': async (options: any) => {
				const { introspect } = await import('../definition');

				options.addApi(introspect.graphql(config));
			},
		},
	};
};
