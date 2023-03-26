import { OperationError } from '@wundergraph/sdk/operations';

export const NotFoundErr = () =>
	new OperationError({
		code: 'NotFound',
		statusCode: 404,
		message: 'Not found',
	});

export const RateLimitErr = () =>
	new OperationError({
		code: 'RateLimit',
		statusCode: 429,
		message: 'Rate limit exceeded',
	});
