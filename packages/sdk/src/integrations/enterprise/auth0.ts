/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Community License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.COMMUNITY.md
 */

import type { OpenIDConnectAuthProviderConfig } from '../../configure/authentication';
import { defineIntegration } from '../define-integration';

export interface Auth0IntegrationOptions extends OpenIDConnectAuthProviderConfig {}

/**
 * Auth0 authentication provider.
 *
 * @license "WunderGraph Community License"
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
