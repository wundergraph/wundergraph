import type { TokenAuthProvider } from '../../configure';
import type { InputVariable } from '../../server';
import { defineIntegration } from '../../integrations/define-integration';

export interface JwtIntegrationOptions extends Omit<TokenAuthProvider, 'jwksJSON' | 'jwksURL'> {
	userInfoEndpoint: InputVariable;
}

/**
 * JWT authentication provider.
 */
export const jwt = defineIntegration<JwtIntegrationOptions>((options) => {
	return {
		name: 'jwt-provider',
		hooks: {
			async 'config:setup'(config) {
				config.addAuthProvider('tokenBased', options);
			},
		},
	};
});
