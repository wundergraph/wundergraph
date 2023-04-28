import { FastifyPluginAsync } from 'fastify';
import path from 'path';
import { InternalClientFactory } from '../internal-client';
import type { TypeScriptOperationFile } from '../../graphql/operations';
import type { NodeJSOperation } from '../../operations/operations';
import { HandlerContext } from '../../operations/operations';
import process from 'node:process';
import { OperationsClient } from '../operations-client';
import { InternalError, OperationError } from '../../client/errors';

interface FastifyFunctionsOptions {
	operations: TypeScriptOperationFile[];
	internalClientFactory: InternalClientFactory;
	nodeURL: string;
	makeContext: () => Promise<any>;
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
					const implementation = maybeImplementation!;
					try {
						const operationClient = new OperationsClient({
							baseURL: config.nodeURL,
							clientRequest: (request.body as any)?.__wg.clientRequest,
						});
						const ctx: HandlerContext<any, any, any, any, any, any> = {
							log: fastify.log,
							user: (request.body as any)?.__wg.user!,
							internalClient: config.internalClientFactory(undefined, (request.body as any)?.__wg.clientRequest),
							clientRequest: (request.body as any)?.__wg.clientRequest,
							input: (request.body as any)?.input,
							operations: operationClient,
							context: await config.makeContext(),
						};

						switch (implementation.type) {
							case 'subscription':
								if (!implementation.subscriptionHandler) {
									return reply.status(500);
								}
								const subscribeOnce = request.headers['x-wg-subscribe-once'] === 'true';
								reply.hijack();
								const gen = await implementation.subscriptionHandler(ctx);
								reply.raw.once('close', () => {
									gen.return(0);
									operationClient.cancelSubscriptions();
								});
								for await (const next of gen) {
									reply.raw.write(`${JSON.stringify({ data: next })}\n\n`);
									if (subscribeOnce) {
										await gen.return(0);
										return reply.raw.end();
									}
								}
								return reply.raw.end();
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
