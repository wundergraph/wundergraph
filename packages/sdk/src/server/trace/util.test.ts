import { getTestTracerProvider } from './trace';
import { attachErrorToSpan, setStatusFromResponseCode } from './util';
import { SpanStatusCode } from '@opentelemetry/api';
import { Attributes } from './attributes';

describe('Util', () => {
	test('Should set the correct span status based on the response status code', async () => {
		const tp = getTestTracerProvider();

		let span = tp.provider.getTracer('test').startSpan('test');
		setStatusFromResponseCode(span, 200);
		span.end();

		let spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBeGreaterThan(0);
		expect(spans[0].status).toEqual({ code: SpanStatusCode.UNSET });
		tp.exporter.reset();

		span = tp.provider.getTracer('test').startSpan('test');
		setStatusFromResponseCode(span, 299);
		span.end();

		spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBeGreaterThan(0);
		expect(spans[0].status).toEqual({ code: SpanStatusCode.UNSET });
		tp.exporter.reset();

		span = tp.provider.getTracer('test').startSpan('test');
		setStatusFromResponseCode(span, 300);
		span.end();

		spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBeGreaterThan(0);
		expect(spans[0].status).toEqual({ code: SpanStatusCode.UNSET });
		tp.exporter.reset();

		span = tp.provider.getTracer('test').startSpan('test');
		setStatusFromResponseCode(span, 400);
		span.end();

		spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBeGreaterThan(0);
		expect(spans[0].status).toEqual({ code: SpanStatusCode.ERROR });
		tp.exporter.reset();
	});

	test('Should attach error information to the span and mark the span as error', async () => {
		const tp = getTestTracerProvider();

		let span = tp.provider.getTracer('test').startSpan('test');
		attachErrorToSpan(span, new Error('test'));
		span.end();

		let spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBeGreaterThan(0);
		expect(spans[0].status).toEqual({ code: SpanStatusCode.ERROR, message: 'test' });
		expect(spans[0].attributes[Attributes.ERROR_NAME]).toEqual('Error');
		expect(spans[0].attributes[Attributes.ERROR_MSG]).toEqual('test');
		expect(spans[0].attributes[Attributes.ERROR_STACK]).toBeDefined();
		tp.exporter.reset();
	});
});
