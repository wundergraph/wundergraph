import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { WunderGraphRequest, WunderGraphResponse } from '../server';
import { HooksConfiguration } from '../../configure';
import { OperationType, WunderGraphConfiguration } from '@wundergraph/protobuf';

export interface BodyResponse {
	data?: any;
	errors?: ReadonlyArray<GraphQLError>;
}

export interface GraphQLError {
	message: string;
	path?: ReadonlyArray<string | number>;
}

export interface FastifyHooksOptions extends HooksConfiguration {
	config: WunderGraphConfiguration;
}

const FastifyHooksPlugin: FastifyPluginAsync<FastifyHooksOptions> = async (fastify, config) => {
	// authentication
	fastify.post<{ Body: { access_token: any; id_token: any } }>(
		'/authentication/postAuthentication',
		async (request, reply) => {
			reply.type('application/json').code(200);
			if (config.authentication?.postAuthentication !== undefined && request.ctx.user !== undefined) {
				try {
					await config.authentication.postAuthentication(
						request.ctx.user,
						request.body.access_token || {},
						request.body.id_token || {}
					);
				} catch (err) {
					request.log.error(err);
					reply.code(500);
					return { hook: 'postAuthentication', error: err };
				}
			}
			return {
				hook: 'postAuthentication',
			};
		}
	);
	fastify.post('/authentication/mutatingPostAuthentication', async (request, reply) => {
		reply.type('application/json').code(200);
		if (config.authentication?.mutatingPostAuthentication !== undefined && request.ctx.user !== undefined) {
			try {
				const out = await config.authentication.mutatingPostAuthentication(request.ctx.user);
				return {
					hook: 'mutatingPostAuthentication',
					response: out,
					setClientRequestHeaders: request.setClientRequestHeaders,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { hook: 'mutatingPostAuthentication', error: err };
			}
		}
	});
	fastify.post<{ Body: { access_token: any; id_token: any } }>(
		'/authentication/revalidateAuthentication',
		async (request, reply) => {
			reply.type('application/json').code(200);
			if (config.authentication?.revalidate !== undefined && request.ctx.user !== undefined) {
				try {
					const out = await config.authentication.revalidate(
						request.ctx.user,
						request.body.access_token || {},
						request.body.id_token || {}
					);
					return {
						hook: 'revalidateAuthentication',
						response: out,
						setClientRequestHeaders: request.setClientRequestHeaders,
					};
				} catch (err) {
					request.log.error(err);
					reply.code(500);
					return { hook: 'revalidateAuthentication', error: err };
				}
			}
		}
	);

	// global hooks

	// httpTransport

	fastify.post<{
		Body: { request: WunderGraphRequest; operationName: string; operationType: 'query' | 'mutation' | 'subscription' };
	}>('/global/httpTransport/onRequest', async (request, reply) => {
		reply.type('application/json').code(200);
		try {
			const maybeHookOut = await config.global?.httpTransport?.onRequest?.hook(
				{
					user: request.ctx.user,
					operationName: request.body.operationName,
					operationType: request.body.operationType,
				},
				request.body.request
			);
			const hookOut = maybeHookOut || 'skip';
			return {
				op: request.body.operationName,
				hook: 'onRequest',
				response: {
					skip: hookOut === 'skip',
					cancel: hookOut === 'cancel',
					request: hookOut !== 'skip' && hookOut !== 'cancel' ? hookOut : undefined,
				},
			};
		} catch (err) {
			request.log.error(err);
			reply.code(500);
			return { op: 'Messages', hook: 'postResolve', error: err };
		}
	});

	fastify.post<{
		Body: {
			response: WunderGraphResponse;
			operationName: string;
			operationType: 'query' | 'mutation' | 'subscription';
		};
	}>('/global/httpTransport/onResponse', async (request, reply) => {
		reply.type('application/json').code(200);
		try {
			const maybeHookOut = await config.global?.httpTransport?.onResponse?.hook(
				{
					user: request.ctx.user,
					operationName: request.body.operationName,
					operationType: request.body.operationType,
				},
				request.body.response
			);
			const hookOut = maybeHookOut || 'skip';
			return {
				op: request.body.operationName,
				hook: 'onResponse',
				response: {
					skip: hookOut === 'skip',
					cancel: hookOut === 'cancel',
					response: hookOut !== 'skip' && hookOut !== 'cancel' ? hookOut : undefined,
				},
			};
		} catch (err) {
			request.log.error(err);
			reply.code(500);
			return { op: 'Messages', hook: 'postResolve', error: err };
		}
	});

	const queries =
		config.config.api?.operations.filter((op) => op.operationType == OperationType.QUERY).map((op) => op.name) || [];
	const mutations =
		config.config.api?.operations.filter((op) => op.operationType == OperationType.MUTATION).map((op) => op.name) || [];

	queries.forEach((operationName) => {
		// mock
		fastify.post<{ Body: { response: BodyResponse } }>(
			`/operation/${operationName}/mockResolve`,
			async (request, reply) => {
				reply.type('application/json').code(200);
				try {
					const mutated = await config?.queries?.[operationName]?.mockResolve?.(request.ctx, request.body.response);
					return {
						op: operationName,
						hook: 'mock',
						response: mutated,
						setClientRequestHeaders: request.setClientRequestHeaders,
					};
				} catch (err) {
					request.log.error(err);
					reply.code(500);
					return { op: operationName, hook: 'mock', error: err };
				}
			}
		);

		// preResolve
		fastify.post<{ Body: { input: any } }>(`/operation/${operationName}/preResolve`, async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				await config?.queries?.[operationName]?.preResolve?.(request.ctx, request.body.input);
				return {
					op: operationName,
					hook: 'preResolve',
					setClientRequestHeaders: request.setClientRequestHeaders,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'preResolve', error: err };
			}
		});

		// postResolve
		fastify.post<{ Body: { response: BodyResponse } }>(
			`/operation/${operationName}/postResolve`,
			async (request, reply) => {
				reply.type('application/json').code(200);
				try {
					await config?.queries?.[operationName]?.postResolve?.(request.ctx, request.body.response);
					return {
						op: operationName,
						hook: 'postResolve',
						setClientRequestHeaders: request.setClientRequestHeaders,
					};
				} catch (err) {
					request.log.error(err);
					reply.code(500);
					return { op: operationName, hook: 'postResolve', error: err };
				}
			}
		);

		// mutatingPreResolve
		fastify.post<{ Body: { input: any } }>(`/operation/${operationName}/mutatingPreResolve`, async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const mutatedInput = await config?.queries?.[operationName]?.mutatingPreResolve?.(
					request.ctx,
					request.body.input
				);
				return {
					op: operationName,
					hook: 'mutatingPreResolve',
					input: mutatedInput,
					setClientRequestHeaders: request.setClientRequestHeaders,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'mutatingPreResolve', error: err };
			}
		});

		// mutatingPostResolve
		fastify.post<{ Body: { input: any; response: BodyResponse } }>(
			`/operation/${operationName}/mutatingPostResolve`,
			async (request, reply) => {
				reply.type('application/json').code(200);
				try {
					const hooksArgs: any[] = [request.ctx];
					if (request.body.input && Object.keys(request.body.input).length > 0) {
						hooksArgs.push(request.body.input);
					}
					hooksArgs.push(request.body.response);
					const mutatedResponse = await config?.queries?.[operationName]?.mutatingPostResolve?.(...hooksArgs);
					return {
						op: operationName,
						hook: 'mutatingPostResolve',
						response: mutatedResponse,
						setClientRequestHeaders: request.setClientRequestHeaders,
					};
				} catch (err) {
					request.log.error(err);
					reply.code(500);
					return { op: operationName, hook: 'mutatingPostResolve', error: err };
				}
			}
		);

		// customResolve
		fastify.post<{ Body: { input: any } }>(`/operation/${operationName}/customResolve`, async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const out = await config?.queries?.[operationName]?.customResolve?.(request.ctx, request.body.input);
				return {
					op: operationName,
					hook: 'customResolve',
					response: out || null,
					setClientRequestHeaders: request.setClientRequestHeaders,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'customResolve', error: err };
			}
		});
	});

	mutations.forEach((operationName) => {
		// mock
		fastify.post<{ Body: { input: any } }>(`/operation/${operationName}/mockResolve`, async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const mutatedResponse = await config?.mutations?.[operationName]?.mockResolve?.(
					request.ctx,
					request.body.input
				);
				return {
					op: operationName,
					hook: 'mock',
					response: mutatedResponse,
					setClientRequestHeaders: request.setClientRequestHeaders,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'mock', error: err };
			}
		});

		// preResolve
		fastify.post<{ Body: { input: any } }>(`/operation/${operationName}/preResolve`, async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				await config?.mutations?.[operationName]?.preResolve?.(request.ctx, request.body.input);
				return {
					op: operationName,
					hook: 'preResolve',
					setClientRequestHeaders: request.setClientRequestHeaders,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'preResolve', error: err };
			}
		});

		// postResolve
		fastify.post<{ Body: { input: any; response: BodyResponse } }>(
			`/operation/${operationName}/postResolve`,
			async (request, reply) => {
				reply.type('application/json').code(200);
				try {
					const hooksArgs: any[] = [request.ctx];
					if (request.body.input && Object.keys(request.body.input).length > 0) {
						hooksArgs.push(request.body.input);
					}
					hooksArgs.push(request.body.response);
					await config?.mutations?.[operationName]?.postResolve?.(...hooksArgs);
					return {
						op: operationName,
						hook: 'postResolve',
						setClientRequestHeaders: request.setClientRequestHeaders,
					};
				} catch (err) {
					request.log.error(err);
					reply.code(500);
					return { op: operationName, hook: 'postResolve', error: err };
				}
			}
		);

		// mutatingPreResolve
		fastify.post<{ Body: { input: any } }>(`/operation/${operationName}/mutatingPreResolve`, async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const mutatedInput = await config?.mutations?.[operationName]?.mutatingPreResolve?.(
					request.ctx,
					request.body.input
				);
				return {
					op: operationName,
					hook: 'mutatingPreResolve',
					input: mutatedInput,
					setClientRequestHeaders: request.setClientRequestHeaders,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'mutatingPreResolve', error: err };
			}
		});

		// mutatingPostResolve
		fastify.post<{ Body: { input: any; response: BodyResponse } }>(
			`/operation/${operationName}/mutatingPostResolve`,
			async (request, reply) => {
				reply.type('application/json').code(200);
				try {
					const hooksArgs: any[] = [request.ctx];
					if (request.body.input && Object.keys(request.body.input).length > 0) {
						hooksArgs.push(request.body.input);
					}
					hooksArgs.push(request.body.response);
					const mutatedResponse = await config?.mutations?.[operationName]?.mutatingPostResolve?.(...hooksArgs);
					return {
						op: operationName,
						hook: 'mutatingPostResolve',
						response: mutatedResponse,
						setClientRequestHeaders: request.setClientRequestHeaders,
					};
				} catch (err) {
					request.log.error(err);
					reply.code(500);
					return { op: operationName, hook: 'mutatingPostResolve', error: err };
				}
			}
		);

		// customResolve
		fastify.post<{ Body: { input: any } }>(`/operation/${operationName}/customResolve`, async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const out = await config?.mutations?.[operationName]?.customResolve?.(request.ctx, request.body.input);
				return {
					op: operationName,
					hook: 'customResolve',
					response: out || null,
					setClientRequestHeaders: request.setClientRequestHeaders,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'customResolve', error: err };
			}
		});
	});
};

export default fp(FastifyHooksPlugin, '3.x');
