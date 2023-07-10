import { Span, SpanStatusCode } from '@opentelemetry/api';
import { Attributes } from './attributes';

// setStatus is a helper function to set the status of a span based on the status code of the response
// if the status code is >= 500 the span status is set to error
export const setStatusFromResponseCode = (span: Span, statusCode: number) => {
	if (statusCode >= 500) {
		span.setStatus({ code: SpanStatusCode.ERROR });
	}
};

// attachErrorToSpan is a helper function to attach an error to a span and set the span status to error
export const attachErrorToSpan = (span: Span, err: any) => {
	if (err instanceof Error) {
		span.setStatus({
			message: err.message,
			code: SpanStatusCode.ERROR,
		});
		span.setAttributes({
			[Attributes.ERROR_NAME]: err.name,
			[Attributes.ERROR_MSG]: err.message,
			[Attributes.ERROR_STACK]: err.stack,
		});
	} else {
		const errString = err?.toString() ?? 'UnknownError';
		span.setStatus({
			message: errString,
			code: SpanStatusCode.ERROR,
		});
		span.setAttributes({
			[Attributes.ERROR_MSG]: errString,
		});
	}
};
