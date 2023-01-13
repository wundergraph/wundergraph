type error = {
	propertyPath: string;
	message: string;
	invalidValue: any;
};

interface ResponseJson {
	errors: error[];
	message: string;
	input: object;
}

export class InputValidationError extends Error {
	public errors: error[];
	constructor(public json: ResponseJson, public statusCode: number) {
		super(json.message);
		this.name = 'InputValidationError';
		this.errors = json.errors;
		// because we are extending a built-in class
		Object.setPrototypeOf(this, InputValidationError.prototype);
	}
}
