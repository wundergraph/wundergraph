import { configureWunderGraphApplication, cors, EnvironmentVariable, templates, ValueType } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [],
	server,
	operations,
	authentication: {
		tokenBased: {
			providers: [
				{
					jwksJSON: new EnvironmentVariable('JWKS_JSON'),
				},
			],
		},
		customClaims: {
			/** Implicit: string and required */
			tenantID: {
				jsonPath: 'teid',
			},
			shopID: {
				jsonPath: 'shop.id',
				type: ValueType.INT,
				required: false,
			},
			floatingPointValue: {
				jsonPath: 'f.f.f.f',
				type: ValueType.FLOAT,
			},
			nonExistingDeepValue: {
				jsonPath: 'a.b.c.d.e.f.g.h.i',
			},
		},
	},
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
