type ErrorRepresentation = {
	type: string;
	message: string;
	stack?: string;
};

const errorToJSON = (err: Error): ErrorRepresentation => {
	return {
		type: err.constructor.name,
		message: err.message,
		stack: err.stack,
	};
};

export class ServerError extends Error {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, ServerError.prototype);
	}

	toJSON() {
		return errorToJSON(this);
	}
}
