import { authProviders, configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const spaceX = introspect.graphql({
	apiNamespace: 'spacex',
	url: 'https://spacex-api.fly.dev/graphql/',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [spaceX],
	server,
	operations,
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
			providers: [authProviders.demo()],
			authorizedRedirectUris: ['http://localhost:3000'],
		},
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production',
	},
});
