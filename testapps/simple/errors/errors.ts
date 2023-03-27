import { OperationError } from '@wundergraph/sdk/operations';

export class NotFoundErr extends OperationError {
	statusCode = 404;
	code = 'NotFound' as const;
	message = 'Not found';
}

export class BadRequestErr extends OperationError {
	statusCode = 400;
	code = 'BadRequest' as const;
	message = 'Bad request';
}

export class RateLimitErr extends OperationError {
	statusCode = 429;
	code = 'RateLimit' as const;
	message = 'Rate limit exceeded';
}

export type Errors = NotFoundErr | RateLimitErr;
