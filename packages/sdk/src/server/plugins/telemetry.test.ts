import { createServer } from '../server';
import { internalClientFactory } from '../internal-client';
import { OperationExecutionEngine, OperationType } from '@wundergraph/protobuf';
import { WunderGraphHooksAndServerConfig } from '../types';

describe('FastifyTelemetryPlugin', () => {
	it('should add telemetry data to request object', async () => {
		const clientFactory = internalClientFactory([], 'http://localhost:9991');
		const serverConfig: WunderGraphHooksAndServerConfig = {
			hooks: {
				queries: {
					Image: {
						preResolve: async (hook: any) => {},
					},
				},
			},
		};
		const fastify = await createServer({
			wundergraphDir: '',
			config: {
				api: {
					operations: [
						{
							name: 'Image',
							path: 'Image',
							operationType: OperationType.QUERY,
							engine: OperationExecutionEngine.ENGINE_GRAPHQL,
							variablesSchema: '',
							responseSchema: '',
							cacheConfig: undefined,
							authenticationConfig: undefined,
							liveQueryConfig: undefined,
							authorizationConfig: undefined,
							hooksConfiguration: undefined,
							variablesConfiguration: undefined,
							internal: false,
							interpolationVariablesSchema: '',
							postResolveTransformations: [],
							content: '',
						},
					],
					invalidOperationNames: [],
					engineConfiguration: undefined,
					corsConfiguration: undefined,
					authenticationConfig: undefined,
					serverOptions: undefined,
					nodeOptions: undefined,
					s3UploadConfiguration: [],
					allowedHostNames: [],
					enableGraphqlEndpoint: false,
					webhooks: [],
				},
				apiId: '',
				dangerouslyEnableGraphQLEndpoint: false,
				environmentIds: [],
			},
			serverConfig,
			gracefulShutdown: false,
			clientFactory,
		});

		const resp = await fastify.inject({
			method: 'POST',
			url: '/operation/Image/preResolve',
			payload: {
				input: {},
				__wg: {
					clientRequest: {},
				},
			},
		});

		expect(fastify.hasRequestDecorator('telemetry')).toBe(true);
		expect(resp.statusCode).toEqual(200);
	});
});
