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
		const scope = server.mock({
			match: async ({ url, method }) => {
				return url.path === '/test?a=b' && method === 'GET';
			},
			handler: async () => {
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
			},
		});

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

	test('Should be able to mock the same request multiple times with different responses', async () => {
		let scope = server.mock({
			match: async ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			handler: async () => {
				return {
					body: {
						getUser: {
							id: '123',
						},
					},
				};
			},
		});

		let resp = await fetch(`${server.url()}/test`);
		let data = await resp.json();

		scope.done();

		expect(resp.status).toBe(200);
		expect(data).toEqual({
			getUser: {
				id: '123',
			},
		});

		scope = server.mock({
			match: async ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			handler: async () => {
				return {
					body: {
						getUser: {
							id: '456',
						},
					},
				};
			},
		});

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

	test('Should be able to persist mocks', async () => {
		let scope = server.mock({
			persist: true,
			match: async ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			handler: async () => {
				return {
					body: {
						getUser: {
							id: '123',
						},
					},
				};
			},
		});

		let resp = await fetch(`${server.url()}/test`);
		let data = await resp.json();

		expect(resp.status).toBe(200);
		expect(data).toEqual({
			getUser: {
				id: '123',
			},
		});

		resp = await fetch(`${server.url()}/test`);
		data = await resp.json();

		expect(resp.status).toBe(200);
		expect(data).toEqual({
			getUser: {
				id: '123',
			},
		});

		resp = await fetch(`${server.url()}/test`);
		data = await resp.json();

		scope.done();

		expect(resp.status).toBe(200);
		expect(data).toEqual({
			getUser: {
				id: '123',
			},
		});

		server.reset();
	});

	test('Persistent mocks are only done when at least one request has matched', async () => {
		let scope = server.mock({
			persist: true,
			match: async ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			handler: async () => {
				return {
					body: {
						getUser: {
							id: '123',
						},
					},
				};
			},
		});

		expect(() => scope.done()).toThrow('No request matched.');

		let resp = await fetch(`${server.url()}/test`);
		let data = await resp.json();

		expect(resp.status).toBe(200);
		expect(data).toEqual({
			getUser: {
				id: '123',
			},
		});

		scope.done();

		server.reset();
	});

	test('Should be able to use mock for N requests', async () => {
		let scope = server.mock({
			times: 2,
			match: async ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			handler: async () => {
				return {
					body: {
						getUser: {
							id: '123',
						},
					},
				};
			},
		});

		let resp = await fetch(`${server.url()}/test`);
		let data = await resp.json();

		expect(() => scope.done()).toThrow('Mock is not done. Expect 1 more calls.');

		expect(resp.status).toBe(200);
		expect(data).toEqual({
			getUser: {
				id: '123',
			},
		});

		resp = await fetch(`${server.url()}/test`);
		data = await resp.json();

		scope.done();

		expect(resp.status).toBe(200);

		expect(data).toEqual({
			getUser: {
				id: '123',
			},
		});
	});

	test('Should throw an error when mock could not be found', async () => {
		const scope = server.mock({
			match: async ({ url, method }) => {
				return url.path === '/does_not_exist';
			},
			handler: async () => {
				return {
					body: {
						getUser: {
							id: '123',
						},
					},
				};
			},
		});

		const resp = await fetch(`${server.url()}/test`);

		expect(() => scope.done()).toThrow('No mock matched for request GET /test');

		expect(resp.status).toBe(404);
		expect(scope.isDone).toBe(false);
		expect(scope.error).toBeDefined();
	});

	test('Should return 404 and throw with original error when handler does not match with any mock / handler', async () => {
		let scope = server.mock({
			match: ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			handler: () => {
				throw new Error('Request does not match');
			},
		});

		let resp = await fetch(`${server.url()}/test`);

		expect(resp.status).toBe(404);
		expect(scope.isDone).toBe(false);
		expect(scope.error).toBeDefined();
		// @ts-expect-error
		expect(scope.error.cause).toBeDefined();
		expect(() => scope.done()).toThrow('Request does not match\n' + 'Caused by: No mock matched for request GET /test');

		// Let's test if the mock was reset

		scope = server.mock({
			match: ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			handler: () => {
				return {
					body: {
						getUser: {
							id: '123',
						},
					},
				};
			},
		});

		resp = await fetch(`${server.url()}/test`);

		scope.done();

		expect(scope.isDone).toBe(true);
		expect(scope.error).toBeUndefined();
		expect(resp.status).toBe(200);
		expect(await resp.json()).toEqual({
			getUser: {
				id: '123',
			},
		});
	});

	test('Should return 404 and throw with original error when handler does not match with any mock / match', async () => {
		let scope = server.mock({
			match: ({ url, method }) => {
				throw new Error('Request does not match');
			},
			handler: () => {
				return {};
			},
		});

		let resp = await fetch(`${server.url()}/test`);

		expect(resp.status).toBe(404);
		expect(scope.isDone).toBe(false);
		expect(scope.error).toBeDefined();
		// @ts-expect-error
		expect(scope.error.cause).toBeDefined();
		expect(() => scope.done()).toThrow('Request does not match\n' + 'Caused by: No mock matched for request GET /test');

		// Let's test if the mock was reset

		scope = server.mock({
			match: ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			handler: () => {
				return {
					body: {
						getUser: {
							id: '123',
						},
					},
				};
			},
		});

		resp = await fetch(`${server.url()}/test`);

		scope.done();

		expect(scope.isDone).toBe(true);
		expect(scope.error).toBeUndefined();
		expect(resp.status).toBe(200);
		expect(await resp.json()).toEqual({
			getUser: {
				id: '123',
			},
		});
	});

	test('Should return 404 and throw with not found error when handler does not match with any mock', async () => {
		let scope = server.mock({
			match: ({ url, method }) => {
				return url.path === '/no_match' && method === 'GET';
			},
			handler: () => {
				return {};
			},
		});

		let resp = await fetch(`${server.url()}/test`);

		expect(resp.status).toBe(404);
		expect(scope.isDone).toBe(false);
		expect(scope.error).toBeDefined();
		// @ts-expect-error
		expect(scope.error.cause).toBeUndefined();
		expect(() => scope.done()).toThrow('No mock matched for request GET /test');

		// Let's test if the mock was reset

		scope = server.mock({
			match: ({ url, method }) => {
				return url.path === '/test' && method === 'GET';
			},
			handler: () => {
				return {
					body: {
						getUser: {
							id: '456',
						},
					},
				};
			},
		});

		resp = await fetch(`${server.url()}/test`);

		scope.done();

		expect(scope.isDone).toBe(true);
		expect(scope.error).toBeUndefined();
		expect(resp.status).toBe(200);
	});

	test('Should be possible to consume the payload twice', async () => {
		const scope = server.mock({
			match: async ({ url, method, json }) => {
				const body = await json();

				expect(body).toEqual({ a: 'b' });

				return url.path === '/test?a=b' && method === 'POST';
			},
			handler: async ({ json }) => {
				const body = await json();

				expect(body).toEqual({ a: 'b' });

				return {
					status: 200,
					headers: {
						'X-Foo': 'Bar',
					},
					body,
				};
			},
		});

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
