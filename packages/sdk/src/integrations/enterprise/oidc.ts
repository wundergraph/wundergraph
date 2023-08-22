/*
 * Copyright (c) 2023 WunderGraph Inc.
 * All rights reserved.
 *
 * This file is licensed under the WunderGraph Community License.
 * @see https://github.com/wundergraph/wundergraph/blob/main/LICENSE.COMMUNITY.md
 */

import type { OpenIDConnectAuthProviderConfig } from '../../configure/authentication';
import { defineIntegration } from '../define-integration';

export interface OIDCIntegrationOptions extends OpenIDConnectAuthProviderConfig {}

/**
 * Add a Open ID Connect authentication provider.
 *
 * @license "WunderGraph Community License"
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
