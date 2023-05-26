import Fastify from 'fastify';
import pino from 'pino';
import { getTestTracerProvider } from '../trace/trace';
import { SpanStatusCode } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { Attributes } from '../trace/attributes';

describe('Telemetry plugin', () => {
	test('Should be able to instrument every request', async () => {
		const tp = getTestTracerProvider();

		const fastify = Fastify({
			logger: pino({
				enabled: false,
			}),
		});

		fastify.register(require('./telemetry'), tp);

		fastify.get('/', async (request, reply) => {
			return 'hello world';
		});

		await fastify.inject({
			method: 'GET',
			url: '/',
		});

		const spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBe(1);
		expect(spans[0].status).toBe({ code: SpanStatusCode.UNSET });
		expect(spans[0].attributes).toEqual({
			'http.flavor': '1.1',
			'http.method': 'GET',
			'http.response_content_length': '11',
			'http.route': '/',
			'http.scheme': 'http',
			'http.status_code': 200,
			'http.url': '/',
			'http.user_agent': 'lightMyRequest',
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

		fastify.register(require('./telemetry'), tp);

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
		expect(spans[0].attributes[Attributes.ErrorName]).toBe('Error');
		expect(spans[0].attributes[Attributes.ErrorStack]).toContain('Error: test');
		expect(spans[0].attributes[SemanticAttributes.HTTP_STATUS_CODE]).toBe(500);

		expect(fastify.tracer).toBeDefined();
	});
});
