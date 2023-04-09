import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const weather = introspect.graphql({
	apiNamespace: 'weather',
	url: 'https://weather-api.wundergraph.com/',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [weather],
	server,
	operations,
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
			],
			// create-react-app expects all code to be inside /src
			// path: "../frontend/src/generated",
		},
	],
	// authentication: {
	// 	tokenBased: {
	// 		providers: [
	// 			{
	// 				jwksJSON: new EnvironmentVariable('WEATHER_JWKS_JSON'),
	// 			},
	// 		],
	// 	},
	// },
	// s3UploadProvider: [
	// 	{
	// 		name: 'foo',
	// 		bucketName: 'wundergraph-test',
	// 		accessKeyID: new EnvironmentVariable('AWS_ACCESS_KEY_ID'),
	// 		endpoint: new EnvironmentVariable('AWS_ENDPOINT'),
	// 		secretAccessKey: new EnvironmentVariable('AWS_SECRET_ACCESS_KEY'),
	// 		useSSL: true,
	// 		bucketLocation: 'eu-central-1',
	// 	},
	// ],
	cors: {
		...cors.allowAll,
		allowedOrigins: ['http://localhost:9991', 'http://127.0.0.1:9991'],
	},
	dotGraphQLConfig: {
		hasDotWunderGraphDirectory: false,
	},
	security: {
		enableGraphQLEndpoint: true,
	},
});
