import { FastifyPluginAsync, RawReplyDefaultExpression, RouteHandlerMethod } from 'fastify';
import fp from 'fastify-plugin';
import { WunderGraphRequest, WunderGraphResponse } from '../server';
import { HooksConfiguration } from '../../configure';
import { OperationType, WunderGraphConfiguration } from '@wundergraph/protobuf';
import { RawRequestDefaultExpression, RawServerDefault } from 'fastify/types/utils';

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
	fastify.post<{ Body: {} }>('/authentication/postAuthentication', async (request, reply) => {
		reply.type('application/json').code(200);
		if (config.authentication?.postAuthentication !== undefined && request.ctx.user !== undefined) {
			try {
				await config.authentication.postAuthentication(request.ctx);
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { hook: 'postAuthentication', error: err };
			}
		}
		return {
			hook: 'postAuthentication',
		};
	});
	fastify.post('/authentication/mutatingPostAuthentication', async (request, reply) => {
		reply.type('application/json').code(200);
		if (config.authentication?.mutatingPostAuthentication !== undefined && request.ctx.user !== undefined) {
			try {
				const out = await config.authentication.mutatingPostAuthentication(request.ctx);
				return {
					hook: 'mutatingPostAuthentication',
					response: out,
					setClientRequestHeaders: request.ctx.clientRequest.headers,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { hook: 'mutatingPostAuthentication', error: err };
			}
		}
	});
	fastify.post<{ Body: {} }>('/authentication/revalidateAuthentication', async (request, reply) => {
		reply.type('application/json').code(200);
		if (config.authentication?.revalidate !== undefined && request.ctx.user !== undefined) {
			try {
				const out = await config.authentication.revalidate(request.ctx);
				return {
					hook: 'revalidateAuthentication',
					response: out,
					setClientRequestHeaders: request.ctx.clientRequest.headers,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { hook: 'revalidateAuthentication', error: err };
			}
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
				request: request.body.request,
			});
			const hookOut = maybeHookOut || 'skip';
			return {
				op: request.body.operationName,
				hook: 'onOriginRequest',
				response: {
					skip: hookOut === 'skip',
					cancel: hookOut === 'cancel',
					request: hookOut !== 'skip' && hookOut !== 'cancel' ? hookOut : undefined,
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
				response: request.body.response,
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
					response: hookOut !== 'skip' && hookOut !== 'cancel' ? hookOut : undefined,
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
			operationName: string
		): RouteHandlerMethod<
			RawServerDefault,
			RawRequestDefaultExpression,
			RawReplyDefaultExpression<RawServerDefault>,
			{ Body: { response: BodyResponse; input: any } }
		> =>
		async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const mutated = await config?.queries?.[operationName]?.mockResolve?.({
					...request.ctx,
					input: request.body.input,
				});
				return {
					op: operationName,
					hook: 'mock',
					response: mutated,
					setClientRequestHeaders: request.ctx.clientRequest.headers,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'mock', error: err };
			}
		};

	const preResolve =
		(
			operationName: string
		): RouteHandlerMethod<
			RawServerDefault,
			RawRequestDefaultExpression,
			RawReplyDefaultExpression<RawServerDefault>,
			{ Body: { input: any } }
		> =>
		async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				await config?.queries?.[operationName]?.preResolve?.({
					...request.ctx,
					input: request.body.input,
				});
				return {
					op: operationName,
					hook: 'preResolve',
					setClientRequestHeaders: request.ctx.clientRequest.headers,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'preResolve', error: err };
			}
		};

	const postResolve =
		(
			operationName: string
		): RouteHandlerMethod<
			RawServerDefault,
			RawRequestDefaultExpression,
			RawReplyDefaultExpression<RawServerDefault>,
			{ Body: { response: BodyResponse; input: any } }
		> =>
		async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				await config?.queries?.[operationName]?.postResolve?.({
					...request.ctx,
					input: request.body.input,
					response: request.body.response,
				});
				return {
					op: operationName,
					hook: 'postResolve',
					setClientRequestHeaders: request.ctx.clientRequest.headers,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'postResolve', error: err };
			}
		};

	const mutatingPreResolve =
		(
			operationName: string
		): RouteHandlerMethod<
			RawServerDefault,
			RawRequestDefaultExpression,
			RawReplyDefaultExpression<RawServerDefault>,
			{ Body: { input: any } }
		> =>
		async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const mutatedInput = await config?.queries?.[operationName]?.mutatingPreResolve?.({
					...request.ctx,
					input: request.body.input,
				});
				return {
					op: operationName,
					hook: 'mutatingPreResolve',
					input: mutatedInput,
					setClientRequestHeaders: request.ctx.clientRequest.headers,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'mutatingPreResolve', error: err };
			}
		};

	const mutatingPostResolve =
		(
			operationName: string
		): RouteHandlerMethod<
			RawServerDefault,
			RawRequestDefaultExpression,
			RawReplyDefaultExpression<RawServerDefault>,
			{ Body: { input: any; response: BodyResponse } }
		> =>
		async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const mutatedResponse = await config?.queries?.[operationName]?.mutatingPostResolve?.({
					...request.ctx,
					input: request.body.input,
					response: request.body.response,
				});
				return {
					op: operationName,
					hook: 'mutatingPostResolve',
					response: mutatedResponse,
					setClientRequestHeaders: request.ctx.clientRequest.headers,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'mutatingPostResolve', error: err };
			}
		};

	const customResolve =
		(
			operationName: string
		): RouteHandlerMethod<
			RawServerDefault,
			RawRequestDefaultExpression,
			RawReplyDefaultExpression<RawServerDefault>,
			{ Body: { input: any } }
		> =>
		async (request, reply) => {
			reply.type('application/json').code(200);
			try {
				const out = await config?.queries?.[operationName]?.customResolve?.({
					...request.ctx,
					input: request.body.input,
				});
				return {
					op: operationName,
					hook: 'customResolve',
					response: out || null,
					setClientRequestHeaders: request.ctx.clientRequest.headers,
				};
			} catch (err) {
				request.log.error(err);
				reply.code(500);
				return { op: operationName, hook: 'customResolve', error: err };
			}
		};

	[...queries, ...mutations].forEach((operationName) => {
		fastify.post(`/operation/${operationName}/mockResolve`, mockResolve(operationName));
		fastify.post(`/operation/${operationName}/preResolve`, preResolve(operationName));
		fastify.post(`/operation/${operationName}/postResolve`, postResolve(operationName));
		fastify.post(`/operation/${operationName}/mutatingPreResolve`, mutatingPreResolve(operationName));
		fastify.post(`/operation/${operationName}/mutatingPostResolve`, mutatingPostResolve(operationName));
		fastify.post(`/operation/${operationName}/customResolve`, customResolve(operationName));
	});
};

export default fp(FastifyHooksPlugin, '3.x');
