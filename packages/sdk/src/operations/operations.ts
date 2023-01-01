import { z } from 'zod';

export class Builder<Input, Response> {
	private type: 'query' | 'mutation' | 'subscription' = 'query';
	private inputSchema: z.ZodObject<any> | undefined;
	private _handler: ((input: Input) => Promise<Response> | undefined) | undefined;

	public query() {
		this.type = 'query';
		return this;
	}

	public mutation() {
		this.type = 'mutation';
		return this;
	}

	public input<I extends z.AnyZodObject>(input: I) {
		this.inputSchema = input;
		return this as unknown as Builder<z.infer<I>, Response>;
	}

	public handler<R>(handler: (input: Input) => Promise<R>) {
		const builder: Builder<Input, R> = this as unknown as Builder<Input, R>;
		builder._handler = handler;
		return builder;
	}

	public build(): NodeJSOperation<Input, Response> {
		return {
			type: this.type,
			inputSchema: this.inputSchema,
			handler: this._handler!,
		} as NodeJSOperation<Input, Response>;
	}
}

export type NodeJSOperation<Input, Response> = {
	type: 'query' | 'mutation' | 'subscription';
	inputSchema?: z.ZodObject<any>;
	handler: (input: Input) => Promise<Response> | undefined;
};

export type ExtractInput<B> = B extends NodeJSOperation<infer T, any> ? T : never;
export type ExtractResponse<B> = B extends NodeJSOperation<any, infer T> ? T : never;

export const createOperation = <I, R>() => {
	return new Builder<I, R>();
};
