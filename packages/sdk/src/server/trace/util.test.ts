import { getTestTracerProvider } from './trace';
import { attachErrorToSpan, setStatusFromResponseCode } from './util';
import { SpanStatus, SpanStatusCode } from '@opentelemetry/api';
import { Attributes } from './attributes';

describe('Util', () => {
	const cases: { statusCode: number; expected: SpanStatus }[] = [
		{
			statusCode: 200,
			expected: { code: SpanStatusCode.UNSET },
		},
		{
			statusCode: 201,
			expected: { code: SpanStatusCode.UNSET },
		},
		{
			statusCode: 300,
			expected: { code: SpanStatusCode.UNSET },
		},
		{
			statusCode: 400,
			expected: { code: SpanStatusCode.UNSET },
		},
		{
			statusCode: 500,
			expected: { code: SpanStatusCode.ERROR },
		},
	];

	test.each(cases)(
		'Validate if correct span status is set based on response status code (%i, %i)',
		({ statusCode, expected }) => {
			const tp = getTestTracerProvider();
			let span = tp.provider.getTracer('test').startSpan('test');
			setStatusFromResponseCode(span, statusCode);
			span.end();

			let spans = tp.exporter.getFinishedSpans();
			expect(spans.length).toBeGreaterThan(0);
			expect(spans[0].status).toEqual(expected);
			tp.exporter.reset();
		}
	);

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

	test('Should attach error information to the span even when error is not from type Error', async () => {
		const tp = getTestTracerProvider();

		let span = tp.provider.getTracer('test').startSpan('test');
		attachErrorToSpan(span, 'error string');
		span.end();

		let spans = tp.exporter.getFinishedSpans();

		expect(spans.length).toBeGreaterThan(0);
		expect(spans[0].status).toEqual({ code: SpanStatusCode.ERROR, message: 'error string' });
		expect(spans[0].attributes[Attributes.ERROR_NAME]).toBeUndefined();
		expect(spans[0].attributes[Attributes.ERROR_MSG]).toEqual('error string');
		expect(spans[0].attributes[Attributes.ERROR_STACK]).toBeUndefined();
		tp.exporter.reset();
	});
});
