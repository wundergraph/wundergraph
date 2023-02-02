import { ResponseError } from './ResponseError';

type ValidationError = {
	propertyPath: string;
	message: string;
	invalidValue: any;
};

interface ValidationResponseJSON {
	errors: ValidationError[];
	message: string;
	input: object;
}

export class InputValidationError extends ResponseError {
	public errors: ValidationError[];
	constructor(json: ValidationResponseJSON, public statusCode: number) {
		super(json.message, statusCode);
		this.name = 'InputValidationError';
		this.errors = json.errors;
		// because we are extending a built-in class
		Object.setPrototypeOf(this, InputValidationError.prototype);
	}
}
