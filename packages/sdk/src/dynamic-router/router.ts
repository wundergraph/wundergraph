/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Community License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.COMMUNITY
 */

import { defineIntegration } from '../integrations';
import { DynamicRouterTemplate } from './codegen';

export interface RouteMatcher {
	operationType?: 'query' | 'mutation' | 'subscription';
}

export interface DynamicRouterConfig {
	match: RouteMatcher | RouteMatcher[];
	handler: (context: DynamicRouterContext) => Promise<Response>;
}

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
