import Fastify from 'fastify';
import pino from 'pino';
import { getTestTracerProvider } from '../trace/trace';
import { SpanStatusCode } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { Attributes } from '../trace/attributes';
import { TelemetryPluginOptions } from './telemetry';

describe('Telemetry plugin', () => {
	test('Should be able to instrument every request', async () => {
		const tp = getTestTracerProvider();

		const fastify = Fastify({
			logger: pino({
				enabled: false,
			}),
		});

		fastify.register<TelemetryPluginOptions>(require('./telemetry'), {
			provider: tp.provider,
			serverInfo: {
				host: 'localhost',
				port: 9992,
			},
		});

		fastify.get('/test', async (request, reply) => {
			return 'hello world';
		});

		await fastify.inject({
			method: 'GET',
			url: '/test?a=b',
		});

		const spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBe(1);
		expect(spans[0].status).toEqual({ code: SpanStatusCode.UNSET });
		expect(spans[0].attributes).toEqual({
			'http.flavor': '1.1',
			'http.method': 'GET',
			'http.response_content_length': '11',
			'http.route': '/test',
			'http.scheme': 'http',
			'http.status_code': 200,
			'http.target': '/test?a=b',
			'net.peer.name': 'localhost',
			'net.peer.port': 9992,
			'http.user_agent': 'lightMyRequest',
			'wg.component.name': 'hooks-server',
			'http.host': 'localhost:80',
		});

		expect(fastify.tracer).toBeDefined();
	});

	test('Should mark span on error correctly', async () => {
		const tp = getTestTracerProvider();

		const fastify = Fastify({
			logger: pino({
				enabled: false,
			}),
		});

		fastify.register<TelemetryPluginOptions>(require('./telemetry'), {
			provider: tp.provider,
			serverInfo: {
				host: 'localhost',
				port: 9992,
			},
		});

		fastify.get('/', async (request, reply) => {
			throw new Error('test');
		});

		await fastify.inject({
			method: 'GET',
			url: '/',
		});

		const spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBe(1);
		expect(spans[0].status).toEqual({ code: SpanStatusCode.ERROR });
		expect(spans[0].attributes[Attributes.ERROR_NAME]).toBe('Error');
		expect(spans[0].attributes[Attributes.ERROR_STACK]).toContain('Error: test');
		expect(spans[0].attributes[SemanticAttributes.HTTP_STATUS_CODE]).toBe(500);
		expect(spans[0].attributes[SemanticAttributes.HTTP_TARGET]).toBe('/');
		expect(spans[0].attributes[SemanticAttributes.HTTP_HOST]).toBe('localhost:80');

		expect(fastify.tracer).toBeDefined();
	});
});
