import configureTracerProvider, { getTestTracerProvider, normalizeURL } from './trace';
import pino from 'pino';
import { setStatus } from './util';
import { Span } from '@opentelemetry/sdk-trace-base';
import { SpanStatusCode } from '@opentelemetry/api';

describe('Util', () => {
	test('Should set the correct span status based on the response status code', async () => {
		const tp = getTestTracerProvider();

		let span = tp.provider.getTracer('test').startSpan('test');
		setStatus(span, 200);
		span.end();

		let spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBeGreaterThan(0);
		expect(spans[0].status).toEqual({ code: SpanStatusCode.UNSET });
		tp.exporter.reset();

		span = tp.provider.getTracer('test').startSpan('test');
		setStatus(span, 299);
		span.end();

		spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBeGreaterThan(0);
		expect(spans[0].status).toEqual({ code: SpanStatusCode.UNSET });
		tp.exporter.reset();

		span = tp.provider.getTracer('test').startSpan('test');
		setStatus(span, 300);
		span.end();

		spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBeGreaterThan(0);
		expect(spans[0].status).toEqual({ code: SpanStatusCode.UNSET });
		tp.exporter.reset();

		span = tp.provider.getTracer('test').startSpan('test');
		setStatus(span, 400);
		span.end();

		spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBeGreaterThan(0);
		expect(spans[0].status).toEqual({ code: SpanStatusCode.ERROR });
		tp.exporter.reset();
	});
});
