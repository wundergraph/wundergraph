import { defineIntegration } from '@wundergraph/sdk/integrations';

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
				const { NextJsTemplate } = await import('./template');
				config.addCodeGeneration({
					templates: [new NextJsTemplate()],
					path: options?.path ?? './generated',
				});
			},
		},
	};
});
