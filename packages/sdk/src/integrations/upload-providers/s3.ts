import type { S3UploadConfiguration } from '../../configure';
import { defineIntegration } from '../define-integration';

export interface S3ProviderOptions extends S3UploadConfiguration {}

/**
 * Generic (AWS) S3 provider integration
 */
export const s3Provider = defineIntegration<S3ProviderOptions>((options) => {
	return {
		name: 's3-provider',
		hooks: {
			async 'config:setup'(config) {
				config.addS3Provider(options);
			},
		},
	};
});
