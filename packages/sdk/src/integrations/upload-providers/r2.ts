import type { S3UploadConfiguration } from '../../configure';
import { defineIntegration } from '../define-integration';

export interface R2ProviderOptions extends Omit<S3UploadConfiguration, 'bucketLocation'> {}

/**
 * Cloudflare R2 provider integration
 */
export const r2Provider = defineIntegration<R2ProviderOptions>((options) => {
	const { name = 'r2', ...rest } = options;
	return {
		name: 'r3-provider',
		hooks: {
			async 'config:setup'(config) {
				config.addS3Provider({
					name,
					bucketLocation: 'auto', // r2 defaults to auto
					...rest,
				});
			},
		},
	};
});
