import { defineIntegration } from '@wundergraph/sdk/integrations';
import { NextJsTemplate } from './template';

export interface NextJsIntegrationOptions {
	/**
	 * The path where the generated code should be placed.
	 * @default '../src/generated'
	 */
	path?: string;
}

/**
 * Official WunderGraph Next.js integration
 */
export const nextjs = defineIntegration<NextJsIntegrationOptions>((options) => {
	return {
		name: 'nextjs',
		hooks: {
			async 'config:setup'(config) {
				config.addCodeGeneration({
					templates: [new NextJsTemplate()],
					path: options?.path ?? '../src/generated',
				});
			},
		},
	};
});
