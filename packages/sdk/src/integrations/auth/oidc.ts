import type { OpenIDConnectAuthProviderConfig } from '../../configure/authentication';
import { defineIntegration } from '../define-integration';

export interface OIDCIntegrationOptions extends OpenIDConnectAuthProviderConfig {}

/**
 * Open ID Connect authentication provider.
 */
export const oidc = defineIntegration<OIDCIntegrationOptions>((options) => {
	return {
		name: 'oidc-auth-provider',
		hooks: {
			async 'config:setup'(config) {
				const { authProviders } = await import('../../configure/authentication');
				config.addAuthProvider('cookieBased', authProviders.openIdConnect(options));
			},
		},
	};
});
