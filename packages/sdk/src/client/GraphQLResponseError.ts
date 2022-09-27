import { GraphQLError } from './types';

export class GraphQLResponseError extends Error {
	constructor(public errors: GraphQLError[]) {
		super(errors[0].message);
		this.name = 'GraphQLError';
		// because we are extending a built-in class
		Object.setPrototypeOf(this, GraphQLResponseError.prototype);
	}
}
