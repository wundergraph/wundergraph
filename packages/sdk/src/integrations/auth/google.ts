import type { GoogleAuthProviderConfig } from '../../configure/authentication';
import { defineIntegration } from '../define-integration';

export interface GoogleAuthIntegrationOptions extends GoogleAuthProviderConfig {}

/**
 * Add a Google authentication provider.
 */
export const googleAuthProvider = defineIntegration<GoogleAuthIntegrationOptions>((options) => {
	return {
		name: 'google-auth-provider',
		hooks: {
			async 'config:setup'(config) {
				const { authProviders } = await import('../../configure/authentication');
				config.addAuthProvider('cookieBased', authProviders.google(options));
			},
		},
	};
});
