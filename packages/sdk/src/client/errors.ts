export type ClientOperationErrorCodes = 'AuthorizationError' | 'InputValidationError' | 'ResponseError';
export type TypeScriptOperationErrorCodes = 'InternalError' | 'OperationError';

export interface GraphQLErrorLocation {
	line: number;
	column: number;
}

interface GraphQLErrorExtensionHTTP {
	/**
	 * status contains the response status code
	 */
	status?: number;
	/**
	 * statusText contains the text associated with the status code.
	 * e.g. For a 404 it will be "Not Found"
	 * */
	statusText?: string;
	/**
	 * headers contains the response headers sent by the OpenAPI upstream
	 */
	headers?: Record<string, string>;
}

interface GraphQLErrorExtensionRequest {
	/**
	 * OpenAPI request URL sent by the gateway
	 */
	url?: string;
	/**
	 * OpenAPI request method sent by the gateway
	 */
	method?: string;
}

/**
 * GraphQLErrorExtensions includes extended information added to
 * GraphQL errors.
 */
interface GraphQLErrorExtensions {
	/**
	 * http information, only included in OpenAPI responses
	 */
	http?: GraphQLErrorExtensionHTTP;
	/**
	 * request sent by the gateway to the OpenAPI upstream
	 */
	request?: GraphQLErrorExtensionRequest;
	/**
	 * response text sent by the OpenAPI upstream
	 */
	responseText?: string;
}

interface GraphQLErrorWithExtensions {
	/**
	 * extensions contains non-standard extensions added to GraphQL errors
	 */
	extensions?: GraphQLErrorExtensions;
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
 * HttpResponseError contains additional error information from OpenAPI requests
 */
export interface HttpResponseError {
	/**
	 * statusCode contains the response status code sent by the OpenAPI upstream
	 */
	statusCode?: number;
	/**
	 * headers contains the response headers sent by the OpenAPI upstream. All header
	 * names are normalized to lowercase.
	 */
	headers?: Record<string, string>;
	/**
	 * text represents the raw body text of the response sent by the OpenAPI upstream
	 */
	text?: string;
}

const getHttpResponseErrorFromGraphQLError = (error: GraphQLError): HttpResponseError | undefined => {
	const extensions = (error as GraphQLErrorWithExtensions)?.extensions;
	if (extensions) {
		return {
			statusCode: extensions.http?.status,
			headers: extensions.http?.headers,
			text: extensions.responseText,
		};
	}
};

/**
 * getHttpResponseError returns additional error returned by upstream HTTP servers (for e.g. OpenAPI).
 * If there's no additional error information, it returns undefined.
 */
export const getHttpResponseError = (
	error: ResponseError | GraphQLError | GraphQLError[]
): HttpResponseError | undefined => {
	if (error instanceof ResponseError) {
		return getHttpResponseError(error.errors ?? []);
	}
	if (Array.isArray(error)) {
		for (const graphQLError of error) {
			const httpError = getHttpResponseErrorFromGraphQLError(graphQLError);
			if (httpError) {
				return httpError;
			}
		}
		return undefined;
	}
	return getHttpResponseErrorFromGraphQLError(error);
};

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
