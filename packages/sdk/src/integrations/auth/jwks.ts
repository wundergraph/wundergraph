import type { TokenAuthProvider } from '../../configure';
import type { InputVariable } from '../../server';
import { defineIntegration } from '../../integrations/define-integration';

export interface JwksIntegrationOptions extends TokenAuthProvider {
	userInfoEndpoint: InputVariable;
}

/**
 * JWKS authentication provider.
 */
export const jwks = defineIntegration<JwksIntegrationOptions>((options) => {
	return {
		name: 'jwks-provider',
		hooks: {
			async 'config:setup'(config) {
				config.addAuthProvider('tokenBased', options);
			},
		},
	};
});
