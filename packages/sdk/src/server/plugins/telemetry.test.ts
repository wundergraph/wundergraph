import { createServer } from '../server';
import { internalClientFactory } from '../internal-client';
import { OperationExecutionEngine, OperationType } from '@wundergraph/protobuf';
import { WunderGraphHooksAndServerConfig } from '../types';
import { TelemetryTracerProvider } from '../trace';
import { NodeTracerProvider, NoopSpanProcessor, Tracer } from '@opentelemetry/sdk-trace-node';
import Fastify from 'fastify';
import FastifyTelemetryPlugin from './telemetry';
import { Span, SpanStatusCode } from '@opentelemetry/api';

describe('FastifyTelemetryPlugin', () => {
	describe('register plugins', () => {
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
			await fastify.close();
		});
	});
	describe('telemetry', () => {
		const app = Fastify();
		let provider: NodeTracerProvider;
		let tracer: Tracer;
		let span: Span;
		let tracerProvider: TelemetryTracerProvider;
		const ERROR = Error('error');

		beforeAll(() => {
			provider = new NodeTracerProvider();
			provider.addSpanProcessor(new NoopSpanProcessor());
			tracer = provider.getTracer('hook-server', '0.0.1');
			span = tracer.startSpan('test');
			tracerProvider = {
				provider: provider,
			};
			app.register(FastifyTelemetryPlugin, tracerProvider);
			app.post('/operation/Image/preResolve', async () => {
				return { foo: 'bar' };
			});
			app.post('/operation/Image/postResolve', async (req, resp) => {
				resp.send(ERROR);
			});
			app.ready();
		});

		afterEach(async () => {
			jest.clearAllMocks();
		});

		afterAll(async () => {
			await app.close();
		});

		it('should trace a request', async () => {
			jest.spyOn(provider, 'getTracer').mockReturnValue(tracer);
			jest.spyOn(tracer, 'startSpan').mockReturnValue(span);
			jest.spyOn(span, 'setStatus');
			jest.spyOn(span, 'setAttributes');
			jest.spyOn(span, 'end');

			await app.inject({
				method: 'POST',
				url: '/operation/Image/preResolve',
				headers: {
					'user-agent': 'jest',
				},
			});

			expect(app.hasRequestDecorator('telemetry')).toBe(true);
			expect(provider.getTracer).toBeCalledTimes(1);
			expect(tracer.startSpan).toBeCalledTimes(1);
			expect(span.setAttributes).toBeCalledWith({
				'http.method': 'POST',
				'http.url': '/operation/Image/preResolve',
			});
			expect(span.setAttributes).toBeCalledWith({
				'http.status_code': 200,
			});
			expect(span.setAttributes).toBeCalledTimes(2);
			expect(span.setStatus).toBeCalledWith({ code: SpanStatusCode.OK });
			expect(span.end).toBeCalledTimes(1);
		});
		it('should trace a request with error', async () => {
			jest.spyOn(tracer, 'startSpan').mockReturnValue(span);
			jest.spyOn(span, 'setStatus');
			jest.spyOn(span, 'setAttributes');
			jest.spyOn(span, 'end');

			await app.inject({
				method: 'POST',
				url: '/operation/Image/postResolve',
				headers: {
					'user-agent': 'jest',
				},
			});

			expect(app.hasRequestDecorator('telemetry')).toBe(true);
			expect(tracer.startSpan).toBeCalledTimes(1);
			expect(span.setAttributes).toBeCalledWith({
				'http.method': 'POST',
				'http.url': '/operation/Image/postResolve',
			});
			expect(span.setAttributes).toBeCalledWith({
				'error.name': ERROR.name,
				'error.message': ERROR.message,
				'error.stack': expect.any(String),
			});
			expect(span.setAttributes).toBeCalledWith({
				'http.status_code': 500,
			});
			expect(span.setAttributes).toBeCalledTimes(3);
			expect(span.setStatus).toBeCalledWith({ code: SpanStatusCode.ERROR });
			expect(span.end).toBeCalledTimes(1);
		});
	});
});
