/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Enterprise License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.ENTERPRISE.md
 */

import { defineIntegration } from '../integrations';
import { AdvancedHooksTemplate } from './codegen';

export interface RouteMatcher {
	operationType?: 'query' | 'mutation' | 'subscription';
}

export interface DynamicTransportConfig {
	match: RouteMatcher | RouteMatcher[];
	handler: (context: DynamicTransportContext) => Promise<Response>;
}

export interface DynamicTransportContext {
	request: Request;
}

export const dynamicTransport = defineIntegration((config: DynamicTransportConfig) => {
	return {
		name: 'dynamic-transport',
		hooks: {
			'config:setup': async (options) => {
				options.addCodeGeneration({
					templates: [new AdvancedHooksTemplate()],
				});
			},
			'http:transport': {
				match: config.match,
				handler: config.handler,
			},
		},
	};
});
