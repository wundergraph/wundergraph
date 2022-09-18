export class ResponseError extends Error {
	constructor(public message: string, public statusCode: number) {
		super(message);
		this.name = 'ResponseError';
		// because we are extending a built-in class
		Object.setPrototypeOf(this, ResponseError.prototype);
	}
}
