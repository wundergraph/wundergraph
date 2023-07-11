import type { GraphQLIntrospection } from '@wundergraph/sdk/dist/definition';

export const weather = (config?: Omit<GraphQLIntrospection, 'url'>) => {
	return {
		name: 'weather',
		hooks: {
			'config:setup': async (options: any) => {
				const { introspect } = await import('@wundergraph/sdk');
				options.addApi(
					introspect.graphql({
						apiNamespace: 'weather',
						url: 'https://weather-api.wundergraph.com/',
						...config,
					})
				);
			},
		},
	};
};
