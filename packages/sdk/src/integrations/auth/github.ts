import type { GithubAuthProviderConfig } from '../../configure/authentication';
import { defineIntegration } from '../define-integration';

export interface GithubAuthIntegrationOptions extends GithubAuthProviderConfig {}

/**
 * Github authentication provider.
 */
export const githubAuth = defineIntegration<GithubAuthIntegrationOptions>((options) => {
	return {
		name: 'github-auth-provider',
		hooks: {
			async 'config:setup'(config) {
				const { authProviders } = await import('../../configure/authentication');
				config.addAuthProvider('cookieBased', authProviders.github(options));
			},
		},
	};
});
