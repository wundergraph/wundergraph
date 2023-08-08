import type { GithubAuthProviderConfig } from '../../configure/authentication';
import { defineIntegration } from '../define-integration';

export interface GithubAuthIntegrationOptions extends GithubAuthProviderConfig {}

/**
 * Add a Github authentication provider.
 */
export const githubAuthProvider = defineIntegration<GithubAuthIntegrationOptions>((options) => {
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
