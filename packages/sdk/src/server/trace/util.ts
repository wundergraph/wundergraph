import { Span, SpanStatusCode } from '@opentelemetry/api';

// setStatus is a helper function to set the status of a span based on the status code of the response
// if the status code is >= 400 the span status is set to error
export const setStatus = (span: Span, statusCode: number) => {
	if (statusCode >= 400) {
		span.setStatus({ code: SpanStatusCode.ERROR });
	}
};
