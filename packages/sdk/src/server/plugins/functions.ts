import { FastifyPluginAsync } from 'fastify';
import path from 'path';
import { InternalClientFactory } from '../internal-client';
import type { TypeScriptOperationFile } from '../../graphql/operations';
import type { NodeJSOperation } from '../../operations/operations';
import { HandlerContext } from '../../operations/operations';
import process from 'node:process';

interface FastifyFunctionsOptions {
	operations: TypeScriptOperationFile[];
	internalClientFactory: InternalClientFactory;
}

const FastifyFunctionsPlugin: FastifyPluginAsync<FastifyFunctionsOptions> = async (fastify, config) => {
	for (const operation of config.operations) {
		try {
			const filePath = path.join(process.env.WG_DIR_ABS!, operation.module_path);
			const routeUrl = path.join('/functions', operation.api_mount_path);
			let maybeImplementation: NodeJSOperation<any, any, any, any, any> | undefined;
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
						const ctx: HandlerContext<any, any, any> = {
							log: fastify.log,
							user: (request.body as any)?.__wg.user!,
							internalClient: config.internalClientFactory(undefined, (request.body as any)?.__wg.clientRequest),
							clientRequest: (request.body as any)?.__wg.clientRequest,
							input: (request.body as any)?.input,
						};

						switch (implementation.type) {
							case 'subscription':
								if (!implementation.subscriptionHandler) {
									return reply.status(500);
								}
								const subscribeOnce = request.headers['x-wg-subscribe-once'] === 'true';
								reply.hijack();
								const gen = await implementation.subscriptionHandler(ctx);
								reply.raw.on('close', () => {
									gen.return(0);
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
					} catch (e) {
						fastify.log.error(e);
						if (implementation.type === 'subscription') {
							reply.raw.end();
						} else {
							reply.code(500);
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
