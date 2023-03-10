import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

function serviceUrl(serviceName: string): string {
	return 'http://' + serviceName + '.dev-stage.onramp2dev.com';
}

const kyc_storage = introspect.openApi({
	apiNamespace: 'kyc_storage',
	source: {
		kind: 'file',
		filePath: '../openapi/openapi_kyc_storage.yaml',
	},
	introspection: {
		pollingIntervalSeconds: 2,
	},
	requestTimeoutSeconds: 10, // optional
	baseURL: serviceUrl('kyc-storage-api-facade-service'),
	statusCodeUnions: true,
});

// const kyc_status = introspect.openApi({
// 	apiNamespace: 'kyc_status',
// 	source: {
// 		kind: 'file',
// 		filePath: '../openapi/openapi_kyc_status.yaml',
// 	},
// 	introspection: {
// 		pollingIntervalSeconds: 2,
// 	},
// 	requestTimeoutSeconds: 10, // optional
// 	baseURL: serviceUrl('kyc-status-service'),
// 	statusCodeUnions: true,
// });
//
// const purchase_component = introspect.openApi({
// 	apiNamespace: 'purchase_component',
// 	source: {
// 		kind: 'file',
// 		filePath: '../openapi/openapi_purchase_component.yaml',
// 	},
// 	introspection: {
// 		pollingIntervalSeconds: 2,
// 	},
// 	requestTimeoutSeconds: 10, // optional
// 	baseURL: serviceUrl('purchase-service'),
// 	statusCodeUnions: true,
// });
//
// const authentication = introspect.openApi({
// 	apiNamespace: 'authentication',
// 	source: {
// 		kind: 'file',
// 		filePath: '../openapi/openapi_authentication.yaml',
// 	},
// 	introspection: {
// 		pollingIntervalSeconds: 2,
// 	},
// 	requestTimeoutSeconds: 10, // optional
// 	baseURL: serviceUrl('auth-service'),
// 	statusCodeUnions: true,
// });

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	// apis: [kyc_status, kyc_storage, authentication, purchase_component],
	apis: [kyc_storage],
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
