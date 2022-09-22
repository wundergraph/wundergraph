import { createServer } from '../server';
import { ClientRequest, FastifyRequestBody, WunderGraphHooksAndServerConfig, WunderGraphUser } from '../types';
import { internalClientFactory } from '../internal-client';

export const getFastify = async (serverConfig: WunderGraphHooksAndServerConfig) => {
	const clientFactory = internalClientFactory('app', 'app', [], 'http://localhost:9991');

	const fastify = await createServer({
		wundergraphDir: '',
		config: {
			api: undefined,
			apiId: '',
			apiName: '',
			deploymentName: '',
			dangerouslyEnableGraphQLEndpoint: false,
			environmentIds: [],
		},
		serverConfig,
		gracefulShutdown: false,
		clientFactory,
	});
	return fastify;
};

test('tests to verify the fastify authentication endpoints', async () => {
	const serverConfig = {
		hooks: {
			authentication: {
				postAuthentication: (...args: any[]) =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve('');
						}, 30);
					}),
				mutatingPostAuthentication: (...args: any[]) =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve('');
						}, 30);
					}),
				revalidate: (...args: any[]) =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve('');
						}, 30);
					}),
				postLogout: (...args: any[]) =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve('');
						}, 30);
					}),
			},
		},
	};
	const fastify = await getFastify(serverConfig);
	const postAuthenticationResponse = await fastify.inject({
		method: 'POST',
		url: '/authentication/postAuthentication',
		payload: {
			__wg: {
				user: {},
				clientRequest: {},
			},
		} as FastifyRequestBody,
	});
	expect(postAuthenticationResponse.statusCode).toEqual(200);

	const mutatingPostAuthenticationResponse = await fastify.inject({
		method: 'POST',
		url: '/authentication/mutatingPostAuthentication',
		payload: {
			__wg: {
				user: {},
				clientRequest: {},
			},
		} as FastifyRequestBody,
	});
	expect(mutatingPostAuthenticationResponse.statusCode).toEqual(200);

	const revalidateAuthenticationResponse = await fastify.inject({
		method: 'POST',
		url: '/authentication/revalidateAuthentication',
		payload: {
			__wg: {
				user: {},
				clientRequest: {},
			},
		} as FastifyRequestBody,
	});
	expect(revalidateAuthenticationResponse.statusCode).toEqual(200);

	const postLogoutResponse = await fastify.inject({
		method: 'POST',
		url: '/authentication/postLogout',
		payload: {
			__wg: {
				user: {},
				clientRequest: {},
			},
		} as FastifyRequestBody,
	});
	expect(postLogoutResponse.statusCode).toEqual(200);
});

test('tests to verify if the fastify authentication endpoints have user context check', async () => {
	const serverConfig = {
		hooks: {
			authentication: {
				postAuthentication: (...args: any[]) =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve('');
						}, 30);
					}),
				mutatingPostAuthentication: (...args: any[]) =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve('');
						}, 30);
					}),
				revalidate: (...args: any[]) =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve('');
						}, 30);
					}),
				postLogout: (...args: any[]) =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve('');
						}, 30);
					}),
			},
		},
	};
	const fastify = await getFastify(serverConfig);
	const postAuthenticationResponse = await fastify.inject({
		method: 'POST',
		url: '/authentication/postAuthentication',
		payload: {
			__wg: {
				clientRequest: {},
			},
		} as FastifyRequestBody,
	});
	expect(postAuthenticationResponse.statusCode).toEqual(400);
	expect(postAuthenticationResponse.json()).toEqual({ error: "User context doesn't exist" });

	const mutatingPostAuthenticationResponse = await fastify.inject({
		method: 'POST',
		url: '/authentication/mutatingPostAuthentication',
		payload: {
			__wg: {
				clientRequest: {},
			},
		} as FastifyRequestBody,
	});
	expect(mutatingPostAuthenticationResponse.statusCode).toEqual(400);
	expect(postAuthenticationResponse.json()).toEqual({ error: "User context doesn't exist" });

	const revalidateAuthenticationResponse = await fastify.inject({
		method: 'POST',
		url: '/authentication/revalidateAuthentication',
		payload: {
			__wg: {
				clientRequest: {},
			},
		} as FastifyRequestBody,
	});
	expect(revalidateAuthenticationResponse.statusCode).toEqual(400);
	expect(postAuthenticationResponse.json()).toEqual({ error: "User context doesn't exist" });

	const postLogoutResponse = await fastify.inject({
		method: 'POST',
		url: '/authentication/postLogout',
		payload: {
			__wg: {
				clientRequest: {},
			},
		} as FastifyRequestBody,
	});
	expect(postLogoutResponse.statusCode).toEqual(400);
	expect(postAuthenticationResponse.json()).toEqual({ error: "User context doesn't exist" });
});

test('tests to verify if only the hooks used have fastify authentication hooks', async () => {
	const serverConfig = {
		hooks: {
			// none of the hooks are used
			authentication: {},
		},
	};
	const fastify = await getFastify(serverConfig);
	const postAuthenticationResponse = await fastify.inject({
		method: 'POST',
		url: '/authentication/postAuthentication',
		payload: {
			__wg: {
				clientRequest: {},
			},
		} as FastifyRequestBody,
	});
	expect(postAuthenticationResponse.statusCode).toEqual(404);

	const mutatingPostAuthenticationResponse = await fastify.inject({
		method: 'POST',
		url: '/authentication/mutatingPostAuthentication',
		payload: {
			__wg: {
				clientRequest: {},
			},
		} as FastifyRequestBody,
	});
	expect(mutatingPostAuthenticationResponse.statusCode).toEqual(404);

	const revalidateAuthenticationResponse = await fastify.inject({
		method: 'POST',
		url: '/authentication/revalidateAuthentication',
		payload: {
			__wg: {
				clientRequest: {},
			},
		} as FastifyRequestBody,
	});
	expect(revalidateAuthenticationResponse.statusCode).toEqual(404);

	const postLogoutResponse = await fastify.inject({
		method: 'POST',
		url: '/authentication/postLogout',
		payload: {
			__wg: {
				clientRequest: {},
			},
		} as FastifyRequestBody,
	});
	expect(postLogoutResponse.statusCode).toEqual(404);
});
