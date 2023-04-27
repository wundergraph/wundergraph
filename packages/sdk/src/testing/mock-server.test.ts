import { WunderGraphMockServer } from './mock-server';

describe('Mock server', () => {
	let server: WunderGraphMockServer;
	beforeEach(async () => {
		server = new WunderGraphMockServer();
		await server.start();
	});
	afterEach(async () => {
		await server.stop();
	});

	test('Should be able to mock an endpoint', async () => {
		const scope = server.mock(
			async ({ url, method }) => {
				return url.path === '/test?a=b' && method === 'GET';
			},
			async () => {
				return {
					status: 200,
					headers: {
						'X-Foo': 'Bar',
					},
					body: {
						getUser: {
							id: '123',
						},
					},
				};
			}
		);

		const resp = await fetch(`${server.url()}/test?a=b`);
		const data = await resp.json();

		scope.done();

		expect(resp.status).toBe(200);
		expect(resp.headers.get('x-foo')).toEqual('Bar');
		expect(data).toEqual({
			getUser: {
				id: '123',
			},
		});
	});

	test('Should be able to mock the same request multiple times', async () => {
		let scope = server.mock(
			async ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			async () => {
				return {
					body: {
						getUser: {
							id: '123',
						},
					},
				};
			}
		);

		let resp = await fetch(`${server.url()}/test`);
		let data = await resp.json();

		scope.done();

		expect(resp.status).toBe(200);
		expect(data).toEqual({
			getUser: {
				id: '123',
			},
		});

		scope = server.mock(
			async ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			async () => {
				return {
					body: {
						getUser: {
							id: '456',
						},
					},
				};
			}
		);

		resp = await fetch(`${server.url()}/test`);
		data = await resp.json();

		scope.done();

		expect(resp.status).toBe(200);
		expect(data).toEqual({
			getUser: {
				id: '456',
			},
		});
	});

	test('Should throw an error when mock interceptor could not be found', async () => {
		const scope = server.mock(
			async ({ url, method }) => {
				return url.path === '/does_not_exist';
			},
			async () => {
				return {
					body: {
						getUser: {
							id: '123',
						},
					},
				};
			}
		);

		const resp = await fetch(`${server.url()}/test`);

		expect(() => scope.done()).toThrow('no interceptor matched for request GET /test');

		expect(resp.status).toBe(404);
		expect(scope.isDone).toBe(false);
		expect(scope.error).toBeDefined();
	});

	test('Should return 404 when handler does not match with any interceptor', async () => {
		let scope = server.mock(
			async ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			async () => {
				throw new Error('This should not be called');

				return {};
			}
		);

		const resp = await fetch(`${server.url()}/test`);

		expect(resp.status).toBe(404);
		expect(scope.isDone).toBe(false);
		expect(scope.error).toBeDefined();
		expect(() => scope.done()).toThrow('no interceptor matched for request GET /test');
	});

	test('Should try the next interceptor when the previous does not match or throws an error', async () => {
		let scope = server.mock(
			async ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			async () => {
				throw new Error('This should not be called');

				return {};
			}
		);

		let resp = await fetch(`${server.url()}/test`);

		expect(resp.status).toBe(404);
		expect(scope.isDone).toBe(false);
		expect(scope.error).toBeDefined();
		expect(() => scope.done()).toThrow('no interceptor matched for request GET /test');

		scope = server.mock(
			async ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			async () => {
				return {
					body: {
						getUser: {
							id: '456',
						},
					},
				};
			}
		);

		resp = await fetch(`${server.url()}/test`);

		scope.done();

		expect(scope.isDone).toBe(true);
		expect(scope.error).toBeUndefined();
		expect(resp.status).toBe(200);
	});

	test('Should be possible to consume the payload twice', async () => {
		const scope = server.mock(
			async ({ url, method, json }) => {
				const body = await json();

				expect(body).toEqual({ a: 'b' });

				return url.path === '/test?a=b' && method === 'POST';
			},
			async ({ json }) => {
				const body = await json();

				expect(body).toEqual({ a: 'b' });

				return {
					status: 200,
					headers: {
						'X-Foo': 'Bar',
					},
					body,
				};
			}
		);

		const resp = await fetch(`${server.url()}/test?a=b`, {
			method: 'POST',
			headers: {
				Accept: 'application.json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ a: 'b' }),
		});
		const data = await resp.json();

		scope.done();

		expect(resp.status).toBe(200);
		expect(resp.headers.get('x-foo')).toEqual('Bar');
		expect(data).toEqual({ a: 'b' });
	});
});
