import { ResponseError } from './ResponseError';

export class AuthorizationError extends ResponseError {
	constructor(public message: string = 'Not authorized', public statusCode: number) {
		super(message, statusCode);
		this.name = 'AuthorizationError';
		// because we are extending a built-in class
		Object.setPrototypeOf(this, AuthorizationError.prototype);
	}
}
