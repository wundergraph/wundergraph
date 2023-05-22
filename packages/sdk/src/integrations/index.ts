import { GraphQLIntrospection, introspect } from '../definition';

export interface GraphQLIntegration extends GraphQLIntrospection {}

export const graphql = (config: GraphQLIntegration) => {
	return {
		name: 'graphql',
		hooks: {
			'config:setup': (options: any) => {
				options.addApi(introspect.graphql(config));
			},
		},
	};
};
