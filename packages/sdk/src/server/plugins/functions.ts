import { FastifyPluginAsync } from 'fastify';
import path from 'path';
import type { ORM } from '@wundergraph/orm';

import { InternalClientFactory } from '../internal-client';
import type { TypeScriptOperationFile } from '../../graphql/operations';
import type { NodeJSOperation } from '../../operations';
import { HandlerContext } from '../../operations';
import process from 'node:process';
import { OperationsClient } from '../operations-client';
import { InternalError, OperationError } from '../../client/errors';
import { Logger } from '../../logger';
import type { AsyncStore, OperationsAsyncContext } from '../operations-context';
import { propagation, trace } from '@opentelemetry/api';
import { createClientRequest, rawClientRequest } from '../server';
import { FastifyRequestBody } from '../types';
import { Attributes } from '../trace/attributes';
import { attachErrorToSpan } from '../trace/util';
import { createLogger } from '../logger';

interface FastifyFunctionsOptions {
	operationsRequestContext: OperationsAsyncContext;
	operations: TypeScriptOperationFile[];
	internalClientFactory: InternalClientFactory;
	orm: ORM<any>;
	nodeURL: string;
	globalContext: any;
	createContext: (globalContext: any) => Promise<any>;
	releaseContext: (requestContext: any) => Promise<void>;
}

interface FunctionRouteConfig {
	kind: 'function';
	functionName?: string;
}

const FastifyFunctionsPlugin: FastifyPluginAsync<FastifyFunctionsOptions> = async (fastify, config) => {
	const { operations, internalClientFactory, orm, nodeURL, operationsRequestContext } = config;

	for (const operation of operations) {
		try {
			let operationPath = operation.module_path;
			if (operationPath.endsWith('.cjs')) {
				operationPath = operationPath.slice(0, -4);
			}
			const filePath = path.join(process.env.WG_DIR_ABS!, operationPath + '.cjs');
			const routeUrl = `/functions/${operation.api_mount_path}`;
			let maybeImplementation: NodeJSOperation<any, any, any, any, any, any, any, any, any, any> | undefined;
			try {
				maybeImplementation = (await import(filePath)).default;
			} catch (e) {
				continue;
			}
			if (!maybeImplementation) {
				continue;
			}
			fastify.route<{ Body: FastifyRequestBody }, FunctionRouteConfig>({
				url: routeUrl,
				method: ['POST'],
				config: {
					kind: 'function',
					functionName: operation.operation_name,
				},
				handler: async (req, reply) => {
					let requestContext;
					const implementation = maybeImplementation!;
					try {
						const headers: { [key: string]: string } = {
							'x-request-id': req.id,
						};

						if (req.telemetry) {
							propagation.inject(req.telemetry.context, headers);
						}

						requestContext = await config.createContext(config.globalContext);
						const clientRequest = rawClientRequest(req.body);
						const operationClient = new OperationsClient({
							baseURL: nodeURL,
							clientRequest,
							extraHeaders: headers,
							tracer: fastify.tracer,
							traceContext: req.telemetry?.context,
						});
						const ctx: HandlerContext<any, any, any, any, any, any, any> = {
							log: createLogger(fastify.log),
							user: (req.body as any)?.__wg.user!,
							internalClient: internalClientFactory(headers, clientRequest),
							clientRequest: createClientRequest(req.body),
							input: (req.body as any)?.input,
							operations: operationClient,
							context: requestContext,
							graph: orm,
						};

						switch (implementation.type) {
							case 'subscription':
								// @note this is used by the `orm` to record operations
								// initiated in the context of this request (so that we
								// can implement cancellation/cleanup)
								const context: AsyncStore = { ormOperationControllers: [] };

								// @todo abstract `requestContext` properly (e.g `requestContext.create().scope(() => {/* handler */}))`
								return await operationsRequestContext.run(context, async () => {
									if (!implementation.subscriptionHandler) {
										return reply.status(500);
									}

									reply.hijack();

									const subscribeOnce = req.headers['x-wg-subscribe-once'] === 'true';
									const gen = implementation.subscriptionHandler(ctx);

									reply.raw.once('close', async () => {
										// call return on the operation's `AsyncGenerator`
										await gen.return(0);
										// Cancel operations created by the ORM for this operation
										context.ormOperationControllers.forEach((controller) => controller.abort());
										// @todo move to tracking in-flight operations via. our request context like we do with the ORM
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
					} catch (err: any) {
						// Mark the request as errored and attach information about the error
						if (req.telemetry) {
							attachErrorToSpan(req.telemetry.parentSpan, err);
						}

						let statusCode: number = 500;
						const response: { errors: OperationError[] } = {
							errors: [],
						};

						if (err instanceof OperationError) {
							if (err.statusCode) {
								statusCode = err.statusCode;
							}
							response.errors.push(err);
						} else if (err instanceof Error) {
							response.errors.push(new InternalError({ message: err.message }));
						} else {
							response.errors.push(new InternalError());
						}

						fastify.log.error(err);

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

	fastify.addHook('onRequest', async (req, resp) => {
		if (req.telemetry) {
			const routeConfig = req.routeConfig as FunctionRouteConfig;
			const span = trace.getSpan(req.telemetry.context);
			if (span) {
				if (routeConfig?.kind === 'function') {
					span.setAttributes({
						[Attributes.WG_FUNCTION_NAME]: routeConfig.functionName,
					});
				}
			}
		}
	});
};

export default FastifyFunctionsPlugin;
