import fetch from 'cross-fetch';
import type { Readable } from 'stream';

interface OperationArgs<OperationName, Input> {
	operationName: OperationName;
	input: Input;
}

export interface Operation<Input, Response> {
	input: Input;
	response: Response;
}

export interface Operations {
	[key: string]: Operation<object, unknown>;
}

type ExtractInput<B> = B extends Operation<infer T, any> ? T : never;
type ExtractResponse<B> = B extends Operation<any, infer T> ? T : never;

// generic type to check if all keys of T are optional
type AllOptional<T> = {
	[P in keyof T]?: T[P];
} extends T
	? true
	: false;

// generic type that makes the field input optional if all fields of the Input type are optional
type OptionalInput<T, OperationName> = AllOptional<ExtractInput<T>> extends true
	? { operationName: OperationName; input?: ExtractInput<T> }
	: { operationName: OperationName; input: ExtractInput<T> };

export interface Options {
	baseURL: string;
	extraHeaders?: { [key: string]: string };
	clientRequest: any;
}

export class OperationsClient<Queries = any, Mutations = any, Subscriptions = any> {
	constructor(options: Options) {
		this.options = options;
	}

	private readonly options: Options;

	private subscriptions: AsyncGenerator<any>[] = [];

	public cancelSubscriptions() {
		this.subscriptions.forEach((sub) => sub.return(0));
	}

	public withHeaders = (headers: { [key: string]: string }) => {
		return new OperationsClient<Queries, Mutations, Subscriptions>({
			...this.options,
			extraHeaders: headers,
		});
	};

	public query = async <T extends keyof Queries>(
		args: ExtractInput<Queries[T]> extends never ? Omit<OperationArgs<T, never>, 'input'> : OptionalInput<Queries[T], T>
	): Promise<Queries[T] extends { response: any } ? Queries[T]['response'] : never> => {
		const url = `${this.options.baseURL}/operations/${String(args.operationName)}`;
		const headers = Object.assign(
			{},
			{
				'Content-Type': 'application/json',
				...(this.options.extraHeaders || {}),
			}
		);
		const input = (args as OperationArgs<T, ExtractInput<Queries[T]>>).input || undefined;
		const res = await fetch(url, {
			headers,
			method: 'POST',
			body: JSON.stringify({ input, __wg: { clientRequest: this.options.clientRequest } }),
		});
		return (await res.json()) as Queries[T] extends { response: any } ? Queries[T]['response'] : never;
	};

	public mutate = <T extends keyof Mutations>(
		args: ExtractInput<Mutations[T]> extends never
			? Omit<OperationArgs<T, never>, 'input'>
			: OptionalInput<Mutations[T], T>
	): Promise<Mutations[T] extends { response: any } ? Mutations[T]['response'] : never> => {
		return this.query(args as any);
	};

	public subscribe = async <T extends keyof Subscriptions>(
		args: ExtractInput<Subscriptions[T]> extends never
			? Omit<OperationArgs<T, never>, 'input'>
			: OptionalInput<Subscriptions[T], T>
	): Promise<AsyncGenerator<Subscriptions[T] extends { response: any } ? Subscriptions[T]['response'] : never>> => {
		const url = `${this.options.baseURL}/internal/operations/${String(args.operationName)}`;
		const headers = Object.assign(
			{},
			{
				'Content-Type': 'application/json',
				Accept: 'text/event-stream',
				...(this.options.extraHeaders || {}),
			}
		);
		const input = (args as OperationArgs<T, ExtractInput<Subscriptions[T]>>).input || undefined;
		const body = JSON.stringify({ input, __wg: { clientRequest: this.options.clientRequest } });
		const abort = new AbortController();
		const generator = async function* () {
			try {
				const res = await fetch(url, {
					method: 'POST',
					headers,
					signal: abort.signal,
					body,
				});
				if (res.status !== 200 || !res.body) {
					throw new Error('Bad response' + JSON.stringify(res));
				}
				const decoder = new TextDecoder();
				let buffer = '';
				// due to cross-fetch, we need to cast the body to Readable
				// res.body.getReader() is not available
				// we've debugged this, so we know it's a Readable
				for await (const chunk of res.body as unknown as Readable) {
					const data = decoder.decode(chunk);
					buffer += data;
					if (buffer.endsWith('\n\n')) {
						const json = JSON.parse(buffer.substring(0, buffer.length - 2));
						yield json as Subscriptions[T] extends { response: any } ? Subscriptions[T]['response'] : never;
						buffer = '';
					}
				}
			} finally {
				abort.abort();
			}
		};
		const gen = generator();
		this.subscriptions.push(gen);
		return gen;
	};
}
