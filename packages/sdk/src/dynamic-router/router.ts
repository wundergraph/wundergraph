import { defineIntegration } from '../integrations';
import { DynamicRouterTemplate } from './codegen';

export interface RouteMatcher {
	operationType?: 'query' | 'mutation' | 'subscription';
}

export interface DynamicRouterConfig {
	match: RouteMatcher | RouteMatcher[];
	handler: (context: DynamicRouterContext) => Promise<Response>;
}

// interface DynamicRouterConfig {
// 	routes: DynamicRouterRoute[];
// }

export interface DynamicRouterContext {
	request: Request;
}

export const dynamicRouter = defineIntegration((config: DynamicRouterConfig) => {
	return {
		name: 'dynamic-router',
		hooks: {
			'config:setup': async (options) => {
				options.addCodeGeneration({
					templates: [new DynamicRouterTemplate()],
				});
			},
			'http:transport': {
				match: config.match,
				handler: config.handler,
			},
		},
	};
});
