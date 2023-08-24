/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Enterprise License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.ENTERPRISE.md
 */

import { defineIntegration } from '../../integrations';
import { AdvancedHooksTemplate } from './codegen';

export interface RouteMatcher {
	operationType?: 'query' | 'mutation' | 'subscription';
}

export interface DynamicTransportOptions {
	match: RouteMatcher | RouteMatcher[];
	handler: (context: DynamicTransportContext) => Promise<Response>;
}

export interface DynamicTransportContext {
	request: Request;
}

export const dynamicTransport = defineIntegration<DynamicTransportOptions>((options) => {
	return {
		name: 'dynamic-transport',
		hooks: {
			'config:setup': async (config) => {
				config.addCodeGeneration({
					templates: [new AdvancedHooksTemplate()],
				});
			},
			'http:transport': {
				match: options.match,
				handler: options.handler,
			},
		},
	};
});
