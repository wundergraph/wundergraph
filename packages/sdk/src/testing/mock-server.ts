import { Straightforward, Request } from 'straightforward';
import getRawBody from 'raw-body';
import debug from 'debug';
import { freeport } from './util';

const log = debug('wunderctl:mock-server');

export interface MockResponse<Response = any> {
	status?: number;
	headers?: Record<string, string>;
	body?: Response;
}

export class WunderGraphMockServer {
	private proxy: Straightforward;
	private port: number;

	constructor() {
		this.proxy = new Straightforward();
		this.port = 0;
	}

	/**
	 * Start the server on a random port.
	 */
	async start(): Promise<void> {
		this.port = await freeport();
		await this.proxy.listen(this.port);
	}

	/**
	 * Stop the server.
	 */
	async stop(): Promise<void> {
		process.nextTick(() => this.proxy.close());
		return new Promise((resolve) => {
			this.proxy.once('close', resolve);
		});
	}

	/**
	 * The URL of the mock server.
	 */
	public url(): string {
		return `http://0.0.0.0:${this.port}`;
	}

	/**
	 * Mock a request. The handler is called when the request matches.
	 * Use this, if you want to point your datasource to the mock server.
	 */
	mock<Response = any>(
		match: (req: Request) => Promise<boolean>,
		handler: (req: Request) => Promise<MockResponse<Response>>
	) {
		this.proxy.onRequest.use(async (ctx, next) => {
			let req: Request = ctx.req;
			let res = ctx.res;

			try {
				if (await match(req)) {
					log('request matched: %s %s', req.method, req.url);

					const mockRes = await handler(req);

					let headers: Record<string, string> = { ...(mockRes.headers || {}) };

					let body = '';
					if (mockRes.body) {
						if (typeof mockRes.body != 'string') {
							headers['Content-Type'] = 'application/json; charset=utf-8';
							body = JSON.stringify(mockRes.body);
						} else {
							headers['Content-Type'] = 'text/plain; charset=utf-8';
							body = mockRes.body;
						}

						headers['Content-Length'] = Buffer.byteLength(body).toString();
					}

					res.writeHead(mockRes.status || 200, headers);
					res.end(body);
				} else {
					// Note the common middleware pattern, use `next()`
					// to pass the request to the next handler.
					return next();
				}
			} catch (err: any) {
				log('error in mock handler: %s, %s error: %s', req.method, req.url, err);

				res.writeHead(500);
				res.end();
			}
		});
	}

	/**
	 * Assert that a request is made. The handler is called when the request matches.
	 * Use this, if you use he WG_HTTP_PROXY feature.
	 */
	assertConnect(match: (req: Request) => void) {
		this.proxy.onConnect.use(async ({ req }, next) => {
			match(req);
			return next();
		});
	}
}

export function getJSONBody<Body = any>(req: Request): Promise<Body> {
	return new Promise((resolve, reject) => {
		getRawBody(req, (err, body) => {
			if (err) {
				reject(err);
			} else {
				resolve(JSON.parse(body.toString()));
			}
		});
	});
}
