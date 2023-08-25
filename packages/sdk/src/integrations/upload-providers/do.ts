import type { S3UploadConfiguration } from '../../configure';
import { defineIntegration } from '../define-integration';

export interface DoSpacesOptions extends Omit<S3UploadConfiguration, 'bucketLocation'> {}

/**
 * Digital Ocean Spaces provider integration
 */
export const doSpaces = defineIntegration<DoSpacesOptions>((options) => {
	const { name = 'do', ...rest } = options;
	return {
		name: 'do-spaces-s3-provider',
		hooks: {
			async 'config:setup'(config) {
				config.addS3Provider({
					name,
					bucketLocation: 'eu-central-1', // this is not used and ignored for do
					...rest,
				});
			},
		},
	};
});
