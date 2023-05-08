import { z } from 'zod';
import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';
import { authProviders, configureWunderGraphApplication, cors, EnvironmentVariable, templates } from '@wundergraph/sdk';

import server from './wundergraph.server';
import operations from './wundergraph.operations';

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [],
	server,
	s3UploadProvider: [
		{
			name: 'minio1',
			endpoint: '127.0.0.1:9000',
			accessKeyID: 'test',
			secretAccessKey: '12345678',
			bucketLocation: 'eu-central-1',
			bucketName: 'uploads',
			useSSL: false,
			uploadProfiles: {
				avatar: {
					maxAllowedUploadSizeBytes: 1024 * 1024 * 10, // 10 MB, optional, defaults to 25 MB
					maxAllowedFiles: 1, // limit the number of files to 1, leave undefined for unlimited files
					allowedMimeTypes: ['image/png', 'image/jpeg'], // wildcard is supported, e.g. 'image/*', leave empty/undefined to allow all
					allowedFileExtensions: ['png', 'jpg'], // leave empty/undefined to allow all
					meta: {
						type: 'object',
						properties: {
							postId: {
								type: 'string',
							},
						},
					},
				},
				coverPicture: {
					requireAuthentication: false,
					maxAllowedUploadSizeBytes: 1024 * 1024 * 10, // 10 MB, optional, defaults to 25 MB
					maxAllowedFiles: 1, // limit the number of files to 1, leave undefined for unlimited files
					allowedMimeTypes: ['image/*'], // wildcard is supported, e.g. 'image/*', leave empty/undefined to allow all
					allowedFileExtensions: ['png', 'jpg'], // leave empty/undefined to allow all
				},
				gallery: {
					meta: z.object({
						postId: z.string(),
						position: z.number().positive(),
					}),
				},
			},
		},
		{
			name: 'minio2',
			endpoint: '127.0.0.1:9000',
			accessKeyID: 'test',
			secretAccessKey: '12345678',
			bucketLocation: 'eu-central-1',
			bucketName: 'uploads',
			useSSL: false,
		},
	],
	generate: {
		codeGenerators: [
			{
				templates: [new NextJsTemplate()],
				path: '../components/generated',
			},
		],
	},
	cors: {
		...cors.allowAll,
		allowedOrigins: process.env.NODE_ENV === 'production' ? ['http://localhost:3000'] : ['http://localhost:3000'],
	},
	authentication: {
		cookieBased: {
			providers: [
				authProviders.demo(),
				authProviders.github({
					id: 'gitHub',
					clientId: new EnvironmentVariable('GITHUB_CLIENT_ID'),
					clientSecret: new EnvironmentVariable('GITHUB_CLIENT_SECRET'),
				}),
			],
			authorizedRedirectUris: ['http://localhost:3000'],
		},
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production',
	},
});
