import { FastifyPluginAsync, RawReplyDefaultExpression, RouteHandlerMethod } from 'fastify';
import { WunderGraphRequest, WunderGraphResponse, ClientRequestHeaders, AuthenticationOK } from '../types';
import {
	HooksConfiguration,
	HooksConfigurationOperationType,
	OperationHooksConfiguration,
	OperationHookFunction,
} from '../../configure';
import { WunderGraphConfiguration, OperationType } from '@wundergraph/protobuf';
import { RawRequestDefaultExpression, RawServerDefault } from 'fastify/types/utils';
import { Headers } from '@web-std/fetch';

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

export interface HooksRouteConfig {
	kind: 'hook';
	operationName?: string;
}

const FastifyHooksPlugin: FastifyPluginAsync<FastifyHooksOptions> = async (fastify, config) => {
	const headersToObject = (headers: ClientRequestHeaders) => {
		const headersObj: Record<string, string> = {};
		for (const [key, value] of headers.entries()) {
			headersObj[key] = value;
		}
		return headersObj;
	};

	await fastify.register(async (fastify) => {
		fastify.addHook('preHandler', (request, reply, done) => {
			if (request.ctx.user === undefined) {
				request.log.error("User context doesn't exist");
				reply.code(400).send({ error: "User context doesn't exist" });
			}
			done();
		});

		// authentication
		if (config.authentication?.postAuthentication) {
			fastify.post<{ Body: {} }>('/authentication/postAuthentication', async (request, reply) => {
				try {
					await config.authentication?.postAuthentication?.(request.ctx);
				} catch (err) {
					request.log.error(err);
					reply.code(500).send({ hook: 'postAuthentication', error: err });
				}
				reply.code(200).send({
					hook: 'postAuthentication',
				});
			});
		}

		if (config.authentication?.mutatingPostAuthentication) {
			fastify.post('/authentication/mutatingPostAuthentication', async (request, reply) => {
				try {
					const out = await config.authentication?.mutatingPostAuthentication?.(request.ctx);
					reply.code(200).send({
						hook: 'mutatingPostAuthentication',
						response: out,
						setClientRequestHeaders: headersToObject(request.ctx.clientRequest.headers),
					});
				} catch (err) {
					request.log.error(err);
					reply.code(500).send({ hook: 'mutatingPostAuthentication', error: err });
				}
			});
		}

		if (config.authentication?.revalidate) {
			fastify.post<{ Body: {} }>('/authentication/revalidateAuthentication', async (request, reply) => {
				try {
					const out = await config.authentication?.revalidate?.(request.ctx);
					reply.code(200).send({
						hook: 'revalidateAuthentication',
						response: out,
						setClientRequestHeaders: headersToObject(request.ctx.clientRequest.headers),
					});
				} catch (err) {
					request.log.error(err);
					reply.code(500).send({ hook: 'revalidateAuthentication', error: err });
				}
			});
		}

		if (config.authentication?.postLogout) {
			fastify.post('/authentication/postLogout', async (request, reply) => {
				try {
					const out = await config.authentication?.postLogout?.(request.ctx);
					reply.code(200).send({
						hook: 'postLogout',
						response: out,
						setClientRequestHeaders: headersToObject(request.ctx.clientRequest.headers),
					});
				} catch (err) {
					request.log.error(err);
					reply.code(500).send({ hook: 'postLogout', error: err });
				}
			});
		}
	});

	// global hooks

	// httpTransport

	fastify.post<{
		Body: { request: WunderGraphRequest; operationName: string; operationType: 'query' | 'mutation' | 'subscription' };
	}>('/global/httpTransport/onOriginRequest', async (request, reply) => {
		reply.type('application/json').code(200);
		try {
			const maybeHookOut = await config.global?.httpTransport?.onOriginRequest?.hook({
				...request.ctx,
				operation: {
					name: request.body.operationName,
					type: request.body.operationType,
				},
				request: {
					...request.body.request,
					headers: new Headers(request.body.request.headers),
				},
			});
			const hookOut = maybeHookOut || 'skip';
			return {
				op: request.body.operationName,
				hook: 'onOriginRequest',
				response: {
					skip: hookOut === 'skip',
					cancel: hookOut === 'cancel',
					request:
						hookOut !== 'skip' && hookOut !== 'cancel'
							? { ...hookOut, headers: headersToObject(hookOut.headers) }
							: undefined,
				},
			};
		} catch (err) {
			request.log.error(err);
			reply.code(500);
			return { hook: 'onOriginRequest', error: err };
		}
	});

	fastify.post<{
		Body: {
			response: WunderGraphResponse;
			operationName: string;
			operationType: 'query' | 'mutation' | 'subscription';
		};
	}>('/global/httpTransport/onOriginResponse', async (request, reply) => {
		reply.type('application/json').code(200);
		try {
			const maybeHookOut = await config.global?.httpTransport?.onOriginResponse?.hook({
				...request.ctx,
				response: {
					...request.body.response,
					headers: new Headers(request.body.response.headers),
				},
				operation: {
					name: request.body.operationName,
					type: request.body.operationType,
				},
			});
			const hookOut = maybeHookOut || 'skip';
			return {
				op: request.body.operationName,
				hook: 'onOriginResponse',
				response: {
					skip: hookOut === 'skip',
					cancel: hookOut === 'cancel',
					response:
						hookOut !== 'skip' && hookOut !== 'cancel'
							? { ...hookOut, headers: headersToObject(hookOut.headers) }
							: undefined,
				},
			};
		} catch (err) {
			request.log.error(err);
			reply.code(500);
			return { hook: 'onOriginResponse', error: err };
		}
	});

	const queries =
		config.config.api?.operations.filter((op) => op.operationType == OperationType.QUERY).map((op) => op.name) || [];
	const mutations =
		config.config.api?.operations.filter((op) => op.operationType == OperationType.MUTATION).map((op) => op.name) || [];

	const mockResolve =
		(
			operationName: string,
			hookFunction: OperationHookFunction
		): RouteHandlerMethod<
			RawServerDefault,
			RawRequestDefaultExpression,
			RawReplyDefaultExpression<RawServerDefault>,
			{ Body: { response: BodyResponse; input: any } }
		> =>
		async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const mutated = await hookFunction({
					...request.ctx,
					input: request.body.input,
				});
				return {
					op: operationName,
					hook: 'mock',
					response: mutated,
					setClientRequestHeaders: headersToObject(request.ctx.clientRequest.headers),
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'mock', error: err };
			}
		};

	const preResolve =
		(
			operationName: string,
			hookFunction: OperationHookFunction
		): RouteHandlerMethod<
			RawServerDefault,
			RawRequestDefaultExpression,
			RawReplyDefaultExpression<RawServerDefault>,
			{ Body: { input: any } }
		> =>
		async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				await hookFunction({
					...request.ctx,
					input: request.body.input,
				});
				return {
					op: operationName,
					hook: 'preResolve',
					setClientRequestHeaders: headersToObject(request.ctx.clientRequest.headers),
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'preResolve', error: err };
			}
		};

	const postResolve =
		(
			operationName: string,
			hookFunction: OperationHookFunction
		): RouteHandlerMethod<
			RawServerDefault,
			RawRequestDefaultExpression,
			RawReplyDefaultExpression<RawServerDefault>,
			{ Body: { response: BodyResponse; input: any } }
		> =>
		async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				await hookFunction({
					...request.ctx,
					input: request.body.input,
					response: request.body.response,
				});
				return {
					op: operationName,
					hook: 'postResolve',
					setClientRequestHeaders: headersToObject(request.ctx.clientRequest.headers),
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'postResolve', error: err };
			}
		};

	const mutatingPreResolve =
		(
			operationName: string,
			hookFunction: OperationHookFunction
		): RouteHandlerMethod<
			RawServerDefault,
			RawRequestDefaultExpression,
			RawReplyDefaultExpression<RawServerDefault>,
			{ Body: { input: any } }
		> =>
		async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const mutatedInput = await hookFunction({
					...request.ctx,
					input: request.body.input,
				});
				return {
					op: operationName,
					hook: 'mutatingPreResolve',
					input: mutatedInput,
					setClientRequestHeaders: headersToObject(request.ctx.clientRequest.headers),
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'mutatingPreResolve', error: err };
			}
		};

	const mutatingPostResolve =
		(
			operationName: string,
			hookFunction: OperationHookFunction
		): RouteHandlerMethod<
			RawServerDefault,
			RawRequestDefaultExpression,
			RawReplyDefaultExpression<RawServerDefault>,
			{ Body: { input: any; response: BodyResponse } }
		> =>
		async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const mutatedResponse = await hookFunction({
					...request.ctx,
					input: request.body.input,
					response: request.body.response,
				});
				return {
					op: operationName,
					hook: 'mutatingPostResolve',
					response: mutatedResponse,
					setClientRequestHeaders: headersToObject(request.ctx.clientRequest.headers),
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'mutatingPostResolve', error: err };
			}
		};

	const customResolve =
		(
			operationName: string,
			hookFunction: OperationHookFunction
		): RouteHandlerMethod<
			RawServerDefault,
			RawRequestDefaultExpression,
			RawReplyDefaultExpression<RawServerDefault>,
			{ Body: { input: any } }
		> =>
		async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const out = await hookFunction({
					...request.ctx,
					input: request.body.input,
				});
				return {
					op: operationName,
					hook: 'customResolve',
					response: out || null,
					setClientRequestHeaders: headersToObject(request.ctx.clientRequest.headers),
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'customResolve', error: err };
			}
		};

	function registerOperationHooks(operations: string[], operationHooks: { [p: string]: OperationHooksConfiguration }) {
		operations.forEach((operationName) => {
			const mockResolveOp = operationHooks?.[operationName]?.mockResolve;
			if (mockResolveOp) {
				fastify.post<any, HooksRouteConfig>(
					`/operation/${operationName}/mockResolve`,
					{ config: { operationName, kind: 'hook' } },
					mockResolve(operationName, mockResolveOp)
				);
			}

			const preResolveOp = operationHooks?.[operationName]?.preResolve;
			if (preResolveOp) {
				fastify.post<any, HooksRouteConfig>(
					`/operation/${operationName}/preResolve`,
					{ config: { operationName, kind: 'hook' } },
					preResolve(operationName, preResolveOp)
				);
			}

			const postResolveOp = operationHooks?.[operationName]?.postResolve;
			if (postResolveOp) {
				fastify.post<any, HooksRouteConfig>(
					`/operation/${operationName}/postResolve`,
					{ config: { operationName, kind: 'hook' } },
					postResolve(operationName, postResolveOp)
				);
			}

			const mutatingPreResolveOp = operationHooks?.[operationName]?.mutatingPreResolve;
			if (mutatingPreResolveOp) {
				fastify.post<any, HooksRouteConfig>(
					`/operation/${operationName}/mutatingPreResolve`,
					{ config: { operationName, kind: 'hook' } },
					mutatingPreResolve(operationName, mutatingPreResolveOp)
				);
			}

			const mutatingPostResolveOp = operationHooks?.[operationName]?.mutatingPostResolve;
			if (mutatingPostResolveOp) {
				fastify.post<any, HooksRouteConfig>(
					`/operation/${operationName}/mutatingPostResolve`,
					{ config: { operationName, kind: 'hook' } },
					mutatingPostResolve(operationName, mutatingPostResolveOp)
				);
			}

			const customResolveOp = operationHooks?.[operationName]?.customResolve;
			if (customResolveOp) {
				fastify.post<any, HooksRouteConfig>(
					`/operation/${operationName}/customResolve`,
					{ config: { operationName, kind: 'hook' } },
					customResolve(operationName, customResolveOp)
				);
			}
		});
	}

	// queries
	const queryOperations = config?.[HooksConfigurationOperationType.Queries];
	if (queryOperations) {
		registerOperationHooks(queries, queryOperations);
		fastify.log.debug(`Registered (${queries.length}) query operations`);
	}

	// mutations
	const mutationOperations = config?.[HooksConfigurationOperationType.Mutations];
	if (mutationOperations) {
		registerOperationHooks(mutations, mutationOperations);
		fastify.log.debug(`Registered (${queries.length}) mutation operations`);
	}
};

export default FastifyHooksPlugin;
