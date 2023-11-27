import type { OpenIDConnectAuthProviderConfig } from '../../configure/authentication';
import { defineIntegration } from '../../integrations/define-integration';

export interface Auth0IntegrationOptions extends OpenIDConnectAuthProviderConfig {}

/**
 * Auth0 authentication provider.
 */
export const auth0 = defineIntegration<Auth0IntegrationOptions>((options) => {
	return {
		name: 'auth0-provider',
		hooks: {
			async 'config:setup'(config) {
				const { authProviders } = await import('../../configure/authentication');
				config.addAuthProvider('cookieBased', authProviders.auth0(options));
			},
		},
	};
});
