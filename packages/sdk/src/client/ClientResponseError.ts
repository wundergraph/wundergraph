import { GraphQLResponseError } from './GraphQLResponseError';
import { InputValidationError } from './InputValidationError';
import { AuthorizationError } from './AuthorizationError';
import { ResponseError } from './ResponseError';

/**
 * The client response error.
 * @type ResponseError | GraphQLResponseError | InputValidationError | AuthorizationError
 * @see https://docs.wundergraph.com/docs/clients-reference/typescript-client#error-handling-client-response-error
 */
export type ClientResponseError = ResponseError | GraphQLResponseError | InputValidationError | AuthorizationError;
