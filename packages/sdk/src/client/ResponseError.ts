export class ResponseError extends Error {
	public errors?: { message: string }[] = undefined;
	constructor(public message: string = 'Response not OK', public statusCode: number) {
		super(message);
		this.name = 'ResponseError';
		// because we are extending a built-in class
		Object.setPrototypeOf(this, ResponseError.prototype);
	}
}
