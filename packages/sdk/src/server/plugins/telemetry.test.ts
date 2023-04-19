import { createServer } from '../server';
import { internalClientFactory } from '../internal-client';
import { OperationExecutionEngine, OperationType } from '@wundergraph/protobuf';
import { WunderGraphHooksAndServerConfig, FastifyRequestBody } from '../types';
import { TelemetryTracerProvider, getTestTracerProvider } from '../trace';
import { NodeTracerProvider, NoopSpanProcessor, Tracer } from '@opentelemetry/sdk-trace-node';
import Fastify from 'fastify';
import FastifyTelemetryPlugin from './telemetry';
import { Span, SpanStatusCode } from '@opentelemetry/api';
import { FastifyInstance } from 'fastify';

describe('FastifyTelemetryPlugin', () => {
	describe('register and instrument plugins', () => {
		it('should decorate request with span and span context', async () => {
			const clientFactory = internalClientFactory([], 'http://localhost:9991');
			const serverConfig: WunderGraphHooksAndServerConfig = {
				hooks: {
					authentication: {
						postAuthentication: async () => {},
						mutatingPostAuthentication: async () => {
							return {
								status: 'ok',
								user: {},
							};
						},
						revalidate: async () => {
							return {
								status: 'ok',
								user: {},
							};
						},
						postLogout: async () => {},
					},
					queries: {
						Image: {
							preResolve: async (hook: any) => {},
						},
					},
				},
			};

			const tracerProvider = getTestTracerProvider();

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
						webhooks: [
							{
								name: 'github',
								filePath: '',
								verifier: undefined,
							},
						],
					},
					apiId: '',
					dangerouslyEnableGraphQLEndpoint: false,
					environmentIds: [],
				},
				serverConfig,
				gracefulShutdown: false,
				clientFactory,
				tracerProvider,
			});

			await fastify.inject({
				method: 'GET',
				url: '/webhooks/github',
			});

			const traceId = '84e1afed08e019fc1110464cfa66635c';
			const spanId = '7a085853722dc6d2';
			const traceparent = `00-${traceId}-${spanId}-01`;

			const resp = await fastify.inject({
				method: 'POST',
				url: '/operation/Image/preResolve',
				payload: {
					input: {},
					__wg: {
						clientRequest: {},
					},
				},
				headers: {
					traceparent: traceparent,
				},
			});

			expect(fastify.hasRequestDecorator('telemetry')).toBe(true);
			expect(resp.statusCode).toEqual(200);

			const postAuthenticationResponse = await fastify.inject({
				method: 'POST',
				url: '/authentication/postAuthentication',
				payload: {
					__wg: {
						user: {},
						clientRequest: {},
					},
				} as FastifyRequestBody,
			});
			expect(postAuthenticationResponse.statusCode).toEqual(200);

			expect(tracerProvider.exporter.getFinishedSpans().length).toEqual(3);

			const [webHookSpan, operationHookSpan, authHookSpan] = tracerProvider.exporter.getFinishedSpans();

			// operation hooks
			expect(operationHookSpan.name).toEqual('POST /operation/Image/preResolve');
			expect(operationHookSpan.status.code).toEqual(SpanStatusCode.OK);

			expect(operationHookSpan.spanContext().traceId).toBeDefined();
			expect(operationHookSpan.spanContext().spanId).toBeDefined();

			expect(operationHookSpan.attributes['http.method']).toEqual('POST');
			expect(operationHookSpan.attributes['http.url']).toEqual('/operation/Image/preResolve');
			expect(operationHookSpan.attributes['http.status_code']).toEqual(200);
			expect(operationHookSpan.attributes['wg.hook.name']).toEqual('preResolve');
			expect(operationHookSpan.attributes['wg.hook.type']).toEqual('operation');
			expect(operationHookSpan.attributes['wg.operation.name']).toEqual('Image');
			expect(operationHookSpan.spanContext().traceId).toEqual(traceId);
			expect(operationHookSpan.parentSpanId).toEqual(spanId);
			expect(operationHookSpan.spanContext().traceFlags).toEqual(1);
			expect(operationHookSpan.spanContext().spanId).not.toEqual(spanId);

			// webhhooks
			expect(webHookSpan.name).toEqual('GET /webhooks/github');
			expect(webHookSpan.status.code).toEqual(SpanStatusCode.OK);
			expect(webHookSpan.instrumentationLibrary.name).toEqual('hook-server');
			expect(webHookSpan.instrumentationLibrary.version).toEqual('0.0.1');
			expect(webHookSpan.attributes['http.method']).toEqual('GET');
			expect(webHookSpan.attributes['http.url']).toEqual('/webhooks/github');

			// authentication hooks
			expect(authHookSpan.name).toEqual('POST /authentication/postAuthentication');
			expect(authHookSpan.status.code).toEqual(SpanStatusCode.OK);
			expect(authHookSpan.attributes['http.method']).toEqual('POST');
			expect(authHookSpan.attributes['http.url']).toEqual('/authentication/postAuthentication');
			expect(authHookSpan.attributes['http.status_code']).toEqual(200);
			expect(authHookSpan.attributes['wg.hook.name']).toEqual('postAuthentication');
			expect(authHookSpan.attributes['wg.hook.type']).toEqual('authentication');

			// TODO: test functions plugin, and internal client

			await tracerProvider.exporter.shutdown();
			await fastify.close();
		});
	});

	describe('telemetry plugin flow', () => {
		let app: FastifyInstance;
		let provider: NodeTracerProvider;
		let tracer: Tracer;
		let span: Span;
		let tracerProvider: TelemetryTracerProvider;
		const ERROR = Error('error');

		beforeEach(() => {
			app = Fastify();
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
			app.post('/operation/Image/error', async (req, resp) => {
				resp.send(ERROR);
			});
			app.ready();
		});

		afterEach(async () => {
			jest.clearAllMocks();
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
				url: '/operation/Image/error',
				headers: {
					'user-agent': 'jest',
				},
			});

			expect(app.hasRequestDecorator('telemetry')).toBe(true);
			expect(tracer.startSpan).toBeCalledTimes(1);
			expect(span.setAttributes).toBeCalledWith({
				'http.method': 'POST',
				'http.url': '/operation/Image/error',
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
