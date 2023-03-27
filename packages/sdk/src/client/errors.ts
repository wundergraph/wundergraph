export type ClientOperationErrorCodes = 'AuthorizationError' | 'InputValidationError' | 'ResponseError';
export type TypeScriptOperationErrorCodes = 'InternalError' | 'OperationError';

export interface GraphQLErrorLocation {
	line: number;
	column: number;
}

export interface GraphQLError {
	message: string;
	code?: string;
	location?: ReadonlyArray<GraphQLErrorLocation>;
	path?: ReadonlyArray<string | number>;
}

export type OperationErrorBaseFields = {
	message?: string;
	code: string;
};

/**
 * The base error class for all operation errors.
 * This error can be used to create custom errors on the server.
 */
export class OperationError<Code extends string = string> extends Error {
	public readonly cause?: Error;
	public readonly statusCode: number;
	public readonly code: Code;

	constructor(opts?: { message?: string; code: Code; cause?: Error; statusCode: number }) {
		const message = opts?.message ?? 'Operation error';
		const cause = opts?.cause !== undefined ? opts.cause : undefined;

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore https://github.com/tc39/proposal-error-cause
		super(message, { cause });

		this.code = opts?.code ?? ('OperationError' as Code);
		this.statusCode = opts?.statusCode ?? 500;
		this.name = this.constructor.name;
	}

	public toJSON() {
		const result: OperationErrorBaseFields = {
			code: this.code,
			message: this?.message,
		};
		return result;
	}
}

/**
 * The authorization error is thrown when the user is not authorized to perform an operation.
 * This error can be used on the client and server.
 */
export class AuthorizationError extends OperationError<'AuthorizationError'> {
	constructor(opts?: { message?: string; cause?: Error }) {
		super({
			message: opts?.message ?? 'Not authorized',
			code: 'AuthorizationError',
			statusCode: 401,
			cause: opts?.cause,
		});
	}
}

/**
 * The internal error is thrown when an internal error occurs.
 * This error should only be used on the server.
 */
export class InternalError extends OperationError<'InternalError'> {
	constructor(opts?: { message?: string; cause?: Error }) {
		super({ message: opts?.message, code: 'InternalError', statusCode: 500, cause: opts?.cause });
	}
}

/**
 * The base error class for all client operation errors.
 * This error is thrown when the client receives a response that is not ok.
 * This error should only be used on the client
 */
export class ResponseError<Code extends ClientOperationErrorCodes | string = string> extends OperationError<Code> {
	public readonly errors?: GraphQLError[];
	constructor(opts: { code?: Code; message?: string; cause?: Error; statusCode: number; errors?: GraphQLError[] }) {
		super({
			message: opts.message ?? 'Response is not OK',
			code: opts.code ?? ('ResponseError' as Code),
			cause: opts.cause,
			statusCode: opts.statusCode,
		});
		this.errors = opts.errors;
	}
}

export type ValidationError = {
	propertyPath: string;
	message: string;
	invalidValue: any;
};

export interface ValidationResponseJSON {
	errors: ValidationError[];
	message: string;
	input: object;
}

/**
 * The input validation error is thrown when the server returns a validation error.
 * This error should only be used on the client.
 */
export class InputValidationError extends ResponseError<'InputValidationError'> {
	public errors: ValidationError[];
	constructor(opts: { message?: string; cause?: Error; statusCode: number; errors: ValidationError[] }) {
		super({
			code: 'InputValidationError',
			message: opts.message ?? 'Validation error',
			statusCode: opts.statusCode,
			cause: opts.cause,
		});
		this.errors = opts.errors;
	}
}

/**
 * The client operation errors that are used only in the client.
 */
export type ClientOperationErrors = AuthorizationError | InputValidationError | ResponseError<'ResponseError'>;
