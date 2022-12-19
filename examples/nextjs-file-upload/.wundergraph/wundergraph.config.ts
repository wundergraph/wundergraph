import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';
import { authProviders, configureWunderGraphApplication, cors, EnvironmentVariable, templates } from '@wundergraph/sdk';

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [],
	s3UploadProvider: [
		{
			name: 'minio',
			endpoint: '127.0.0.1:9000',
			accessKeyID: 'test',
			secretAccessKey: '12345678',
			bucketLocation: 'eu-central-1',
			bucketName: 'uploads',
			useSSL: false,
		},
	],
	codeGenerators: [
		{
			templates: [...templates.typescript.all],
		},
		{
			templates: [new NextJsTemplate()],
			path: '../components/generated',
		},
	],
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
