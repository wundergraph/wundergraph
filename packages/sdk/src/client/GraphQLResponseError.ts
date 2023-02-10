import { ResponseError } from './ResponseError';
import { GraphQLError } from './types';

export class GraphQLResponseError extends ResponseError {
	constructor(public errors: GraphQLError[]) {
		super(errors[0].message, 200);
		this.name = 'GraphQLError';
		// because we are extending a built-in class
		Object.setPrototypeOf(this, GraphQLResponseError.prototype);
	}
}
