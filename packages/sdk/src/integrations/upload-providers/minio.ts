import type { S3UploadConfiguration } from '../../configure';
import { defineIntegration } from '../define-integration';

export interface MinioOptions extends Omit<S3UploadConfiguration, 'bucketLocation'> {}

/**
 * Minio upload provider integration
 */
export const minio = defineIntegration<MinioOptions>((options) => {
	const { name = 'minio', ...rest } = options;
	return {
		name: 'minio-s3-provider',
		hooks: {
			async 'config:setup'(config) {
				config.addS3Provider({
					name,
					bucketLocation: 'eu-central-1', // this is not used and ignored for minio
					...rest,
				});
			},
		},
	};
});
