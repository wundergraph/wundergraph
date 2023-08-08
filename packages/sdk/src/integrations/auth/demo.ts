import { defineIntegration } from '../define-integration';

/**
 * Add a demo authentication provider. *Don't use this for production.*
 */
export const demoAuthProvider = defineIntegration(() => {
	return {
		name: 'demo-auth-provider',
		hooks: {
			async 'config:setup'(config) {
				const { authProviders } = await import('../../configure/authentication');
				config.addAuthProvider('cookieBased', authProviders.demo());
			},
		},
	};
});
