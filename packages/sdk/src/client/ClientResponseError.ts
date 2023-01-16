import { GraphQLResponseError } from './GraphQLResponseError';
import { InputValidationError } from './InputValidationError';
import { ResponseError } from './ResponseError';

export type ClientResponseError = ResponseError | GraphQLResponseError | InputValidationError;
