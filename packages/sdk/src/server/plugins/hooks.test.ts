import { internalClientFactory } from '../internal-client';
import { createServer } from '../server';
import { FastifyRequestBody, OnConnectionInitHookRequestBody, WunderGraphHooksAndServerConfig } from '../types';

export const getFastify = async (serverConfig: WunderGraphHooksAndServerConfig) => {
	const clientFactory = internalClientFactory([], 'http://localhost:9991');

	const fastify = await createServer({
		wundergraphDir: '',
		serverHost: 'localhost',
		serverPort: 9992,
		config: {
			api: {
				invalidOperationNames: [],
				engineConfiguration: undefined,
				corsConfiguration: undefined,
				authenticationConfig: undefined,
				serverOptions: undefined,
				nodeOptions: undefined,
				s3UploadConfiguration: [],
				allowedHostNames: [],
				enableGraphqlEndpoint: false,
				webhooks: [],
				experimentalConfig: {
					orm: false,
				},
			},
			apiId: '',
			dangerouslyEnableGraphQLEndpoint: false,

			configHash: '',
			environmentIds: [],
		},
		serverConfig,
		gracefulShutdown: false,
		clientFactory,
	});
	return fastify;
};

test('Hook should return 200 when everything is provided', async () => {
	const serverConfig: WunderGraphHooksAndServerConfig = {
		hooks: {
			authentication: {
				postAuthentication: async () => {},
				mutatingPostAuthentication: async () => {
					return {
						status: 'ok',
						user: {},
					};
				},
				revalidate: async () => {
					return {
						status: 'ok',
						user: {},
					};
				},
				postLogout: async () => {},
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
	expect(postAuthenticationResponse.json()).toEqual({ hook: 'postAuthentication' });

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
	expect(mutatingPostAuthenticationResponse.json()).toEqual({
		hook: 'mutatingPostAuthentication',
		response: {
			status: 'ok',
			user: {},
		},
		setClientRequestHeaders: {},
	});

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
	expect(revalidateAuthenticationResponse.json()).toEqual({
		hook: 'revalidateAuthentication',
		response: {
			status: 'ok',
			user: {},
		},
		setClientRequestHeaders: {},
	});

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
	expect(postLogoutResponse.json()).toEqual({ hook: 'postLogout', setClientRequestHeaders: {} });
});

test('Hook should return 400 when user context was not provided', async () => {
	const serverConfig: WunderGraphHooksAndServerConfig = {
		hooks: {
			authentication: {
				postAuthentication: async () => {},
				mutatingPostAuthentication: async () => {
					return {
						status: 'ok',
						user: {},
					};
				},
				revalidate: async () => {
					return {
						status: 'ok',
						user: {},
					};
				},
				postLogout: async () => {},
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

test('Hook should return 404 if not being used', async () => {
	const serverConfig: WunderGraphHooksAndServerConfig = {
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

test('subscriptions mutatingPostResolve hook', async () => {
	const serverConfig: WunderGraphHooksAndServerConfig = {
		hooks: {
			subscriptions: {
				Chat: {
					mutatingPostResolve: async (hook: any) => {
						return hook.response;
					},
				},
			},
		},
	};
	const fastify = await getFastify(serverConfig);
	const onConnectionInitResponse = await fastify.inject({
		method: 'POST',
		url: '/operation/Chat/mutatingPostResolve',
		payload: {
			input: {},
			__wg: {
				clientRequest: {},
			},
			response: {},
		},
	});
	expect(onConnectionInitResponse.statusCode).toEqual(200);
	expect(onConnectionInitResponse.json()).toEqual({
		hook: 'mutatingPostResolve',
		op: 'Chat',
		response: {},
		setClientRequestHeaders: {},
	});
});

test('subscriptions mutatingPreResolve hook', async () => {
	const serverConfig: WunderGraphHooksAndServerConfig = {
		hooks: {
			subscriptions: {
				Chat: {
					mutatingPreResolve: async (hook: any) => {
						return hook.input;
					},
				},
			},
		},
	};
	const fastify = await getFastify(serverConfig);
	const onConnectionInitResponse = await fastify.inject({
		method: 'POST',
		url: '/operation/Chat/mutatingPreResolve',
		payload: {
			input: {},
			__wg: {
				clientRequest: {},
			},
		},
	});
	expect(onConnectionInitResponse.statusCode).toEqual(200);
	expect(onConnectionInitResponse.json()).toEqual({
		hook: 'mutatingPreResolve',
		op: 'Chat',
		input: {},
		setClientRequestHeaders: {},
	});
});

test('subscriptions preResolve hook', async () => {
	const serverConfig: WunderGraphHooksAndServerConfig = {
		hooks: {
			subscriptions: {
				Chat: {
					preResolve: async (hook: any) => {},
				},
			},
		},
	};
	const fastify = await getFastify(serverConfig);
	const onConnectionInitResponse = await fastify.inject({
		method: 'POST',
		url: '/operation/Chat/preResolve',
		payload: {
			input: {},
			__wg: {
				clientRequest: {},
			},
		},
	});
	expect(onConnectionInitResponse.statusCode).toEqual(200);
	expect(onConnectionInitResponse.json()).toEqual({
		hook: 'preResolve',
		op: 'Chat',
		setClientRequestHeaders: {},
	});
});

test('subscriptions postResolve hook', async () => {
	const serverConfig: WunderGraphHooksAndServerConfig = {
		hooks: {
			subscriptions: {
				Chat: {
					postResolve: async (hook: any) => {},
				},
			},
		},
	};
	const fastify = await getFastify(serverConfig);
	const onConnectionInitResponse = await fastify.inject({
		method: 'POST',
		url: '/operation/Chat/postResolve',
		payload: {
			input: {},
			response: {},
			__wg: {
				clientRequest: {},
			},
		},
	});
	expect(onConnectionInitResponse.statusCode).toEqual(200);
	expect(onConnectionInitResponse.json()).toEqual({
		hook: 'postResolve',
		op: 'Chat',
		setClientRequestHeaders: {},
	});
});

test('onWSTransportConnectionInit hook', async () => {
	const serverConfig: WunderGraphHooksAndServerConfig = {
		hooks: {
			global: {
				wsTransport: {
					onConnectionInit: {
						enableForDataSources: ['chatId'],
						hook: async () => {
							return {
								payload: {
									authentication: 'secret',
								},
							};
						},
					},
				},
			},
		},
	};
	const fastify = await getFastify(serverConfig);
	const onConnectionInitResponse = await fastify.inject({
		method: 'POST',
		url: '/global/wsTransport/onConnectionInit',
		payload: {
			dataSourceId: 'chatId',
			__wg: {
				clientRequest: {},
			},
			request: {},
		} as OnConnectionInitHookRequestBody,
	});
	expect(onConnectionInitResponse.statusCode).toEqual(200);
	expect(onConnectionInitResponse.json()).toEqual({
		hook: 'onConnectionInit',
		response: {
			payload: { authentication: 'secret' },
		},
	});
});
