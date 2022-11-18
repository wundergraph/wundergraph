type HeadersInit = [string, string][] | Record<string, string> | Headers;

export class Headers {
	private storage: Record<string, string[]> = {};

	constructor(init?: HeadersInit) {
		if (!init) {
			return;
		}
		if (init instanceof Headers) {
			for (const key of Object.keys(init.storage)) {
				this.storage[key] = [...init.storage[key]];
			}
		} else if (Array.isArray(init)) {
			const initArray = init as [string, string][];
			for (const item of initArray) {
				this.append(item[0], item[1]);
			}
		} else {
			const initRecord = init as Record<string, string>;
			for (const key of Object.keys(initRecord)) {
				this.storage[key] = [initRecord[key]];
			}
		}
	}

	[Symbol.iterator](): IterableIterator<[string, string]> {
		return this.entries();
	}

	append(name: string, value: string): void {
		if (this.storage[name] === undefined) {
			this.storage[name] = [];
		}
		this.storage[name].push(value);
	}

	delete(name: string): void {
		delete this.storage[name];
	}

	get(name: string): string | null {
		const values = this.storage[name];
		if (values) {
			return values.join(',');
		}
		return null;
	}

	has(name: string): boolean {
		return !!this.storage[name];
	}

	set(name: string, value: string): void {
		this.storage[name] = [];
		for (const item of value.split(',')) {
			this.append(name, item);
		}
	}

	entries(): IterableIterator<[string, string]> {
		let entries: [string, string][] = [];
		for (const key in this.storage) {
			this.storage[key].forEach((element) => {
				entries.push([key, element]);
			});
		}
		return entries.values();
	}

	keys(): IterableIterator<string> {
		return Object.keys(this.storage).values();
	}

	values(): IterableIterator<string> {
		let allValues: string[] = [];
		for (const key in this.storage) {
			this.storage[key].forEach((element) => {
				allValues.push(element);
			});
		}
		return allValues.values();
	}
}

export interface Request {
	readonly headers: Headers;
	readonly method: string;
	readonly url: string;

	text(): Promise<string>;
}

export class RequestImpl implements Request {
	readonly method: string;
	readonly url: string;
	readonly headers: Headers;

	private readonly body: string;

	constructor(method: string, url: string, headers: Headers, body: string) {
		this.method = method;
		this.url = url;
		this.headers = headers;
		this.body = body;
	}

	async text(): Promise<string> {
		return this.body;
	}
}

interface ResponseInit {
	status?: number;
	headers?: HeadersInit;
}

export class Response {
	readonly status: number;
	readonly headers: Headers;

	private readonly body: string;

	constructor(body: string, init?: ResponseInit) {
		this.body = body;
		this.status = init?.status ?? 200;
		this.headers = new Headers(init?.headers);
	}

	async text(): Promise<string> {
		return this.body;
	}
}

type HttpMockResponseFn = (request: Request) => Response;
type HttpMockPromiseResponseFn = (request: Request) => Promise<Response>;

export type HttpMockFn = HttpMockResponseFn | HttpMockPromiseResponseFn;

export interface HTTPMock {
	url: string;
	method: string;
	handler: HttpMockFn;
}

export interface HTTPMockOptions {
	/**
	 * Method to match, case insensitive. If empty, it matches all methods.
	 */
	method: string;
}
