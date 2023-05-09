import { FastifyPluginAsync } from 'fastify';
import path from 'path';
import type { Namespace } from '@wundergraph/orm';
import { AsyncLocalStorage } from 'async_hooks';

import { InternalClientFactory } from '../internal-client';
import type { TypeScriptOperationFile } from '../../graphql/operations';
import type { NodeJSOperation } from '../../operations/operations';
import { HandlerContext } from '../../operations/operations';
import process from 'node:process';
import { OperationsClient } from '../operations-client';
import { InternalError, OperationError } from '../../client/errors';
import { Logger } from '../../logger';

// @note we utilize async context to
interface OpsAsyncContext {
	ormOperationControllers: Array<AbortController>;
}
// @todo move this `AsyncLocalStorage` to be a dependency of the ORM and OperationsClient (so we don't need to use globals)
declare global {
	var __OPERATIONS_ASYNC_STORAGE__: AsyncLocalStorage<OpsAsyncContext> | undefined;
}

globalThis.__OPERATIONS_ASYNC_STORAGE__ = new AsyncLocalStorage();

interface FastifyFunctionsOptions {
	operations: TypeScriptOperationFile[];
	internalClientFactory: InternalClientFactory;
	orm: Namespace<any>;
	nodeURL: string;
	globalContext: any;
	createContext: (globalContext: any) => Promise<any>;
	releaseContext: (requestContext: any) => Promise<void>;
}

const FastifyFunctionsPlugin: FastifyPluginAsync<FastifyFunctionsOptions> = async (fastify, config) => {
	for (const operation of config.operations) {
		try {
			let operationPath = operation.module_path;
			if (operationPath.endsWith('.cjs')) {
				operationPath = operationPath.slice(0, -4);
			}
			const filePath = path.join(process.env.WG_DIR_ABS!, operationPath + '.cjs');
			const routeUrl = `/functions/${operation.api_mount_path}`;
			let maybeImplementation: NodeJSOperation<any, any, any, any, any, any, any, any, any> | undefined;
			try {
				maybeImplementation = (await import(filePath)).default;
			} catch (e) {
				continue;
			}
			if (!maybeImplementation) {
				continue;
			}
			fastify.route({
				url: routeUrl,
				method: ['POST'],
				config: {},
				handler: async (request, reply) => {
					let requestContext;
					const implementation = maybeImplementation!;
					try {
						requestContext = await config.createContext(config.globalContext);
						const clientRequest = (request.body as any)?.__wg.clientRequest;
						const operationClient = new OperationsClient({
							baseURL: config.nodeURL,
							clientRequest,
						});
						const ctx: HandlerContext<any, any, any, any, any, any, any> = {
							log: fastify.log,
							user: (request.body as any)?.__wg.user!,
							internalClient: config.internalClientFactory(undefined, clientRequest),
							clientRequest,
							input: (request.body as any)?.input,
							operations: operationClient,
							context: requestContext,
							graph: config.orm,
						};

						switch (implementation.type) {
							case 'subscription':
								// @note this is used by the `orm` to record operations
								// initiated in the context of this request (so that we
								// can implement cancellation/cleanup)
								const asyncContext: OpsAsyncContext = {
									ormOperationControllers: [
										/* no signals to abort */
									],
								};

								return await globalThis
									.__OPERATIONS_ASYNC_STORAGE__!.run(asyncContext, async () => {
										if (!implementation.subscriptionHandler) {
											return reply.status(500);
										}

										reply.hijack();

										const subscribeOnce = request.headers['x-wg-subscribe-once'] === 'true';
										const gen = implementation.subscriptionHandler(ctx);

										reply.raw.once('close', async () => {
											// call return on the operation's `AsyncGenerator`
											await gen.return(0);
											// Cancel operations created by the ORM for this operation
											asyncContext.ormOperationControllers.forEach((controller) => controller.abort());
											operationClient.cancelSubscriptions();
											Logger.debug('Canceling operations created by operation.');
										});

										for await (const next of gen) {
											reply.raw.write(`${JSON.stringify({ data: next })}\n\n`);
											if (subscribeOnce) {
												await gen.return(0);
												return reply.raw.end();
											}
										}

										return reply.raw.end();
									})
									.catch((e: any) => {
										// @todo return proper `500` error code
										return reply.raw.end();
									});
							case 'query':
								if (!implementation.queryHandler) {
									return reply.status(500);
								}
								const outQuery = await implementation.queryHandler(ctx);
								reply.code(200);
								reply.send({
									response: {
										data: outQuery,
									},
								});
								return;
							case 'mutation':
								if (!implementation.mutationHandler) {
									return reply.status(500);
								}
								const outMutation = await implementation.mutationHandler(ctx);
								reply.code(200);
								reply.send({
									response: {
										data: outMutation,
									},
								});
								return;
						}

						return;
					} catch (e: any) {
						let statusCode: number = 500;
						const response: { errors: OperationError[] } = {
							errors: [],
						};

						if (e instanceof OperationError) {
							if (e.statusCode) {
								statusCode = e.statusCode;
							}
							response.errors.push(e);
						} else if (e instanceof Error) {
							response.errors.push(new InternalError({ message: e.message }));
						} else {
							response.errors.push(new InternalError());
						}

						fastify.log.error(e);

						if (implementation.type === 'subscription') {
							// Raw write because we hijacked the reply
							reply.raw.writeHead(statusCode ?? 500);
							reply.raw.write(`${JSON.stringify(response)}\n\n`);
							reply.raw.end();
						} else {
							reply.code(statusCode ?? 500);
							reply.send({
								response,
							});
						}
					} finally {
						await config.releaseContext(requestContext);
					}
				},
			});
			fastify.log.debug(`Function '${operation.operation_name}' registered at ${routeUrl}`);
		} catch (err) {
			fastify.log.error(err, `Failed to register function at ${operation.module_path}`);
		}
	}
};

export default FastifyFunctionsPlugin;
