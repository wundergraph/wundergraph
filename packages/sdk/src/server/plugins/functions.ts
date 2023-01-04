import { FastifyPluginAsync } from 'fastify';
import path from 'path';
import { InternalClientFactory } from '../internal-client';
import type { TypeScriptOperationFile } from '../../graphql/operations';
import type { NodeJSOperation } from '../../operations/operations';

interface FastifyFunctionsOptions {
	operations: TypeScriptOperationFile[];
	internalClientFactory: InternalClientFactory;
}

const FastifyFunctionsPlugin: FastifyPluginAsync<FastifyFunctionsOptions> = async (fastify, config) => {
	for (const operation of config.operations) {
		try {
			const implementation: NodeJSOperation<any, any, any> = (await import(operation.module_path)).default;
			const routeUrl = path.join('/functions', operation.operation_name);
			fastify.route({
				url: routeUrl,
				method: ['POST'],
				config: {},
				handler: async (request, reply) => {
					try {
						switch (implementation.type) {
							case 'subscription':
								if (!implementation.subscriptionHandler) {
									return reply.status(500);
								}
								const gen = await implementation.subscriptionHandler({
									input: request.body,
								});
								reply.hijack();
								reply.raw.on('close', () => {
									gen.return(0);
								});
								while (true) {
									const next = await gen.next();
									if (next.done) {
										return reply.raw.end();
									}
									reply.raw.write(`${JSON.stringify({ data: next.value })}\n\n`);
								}
							case 'query':
								if (!implementation.queryHandler) {
									return reply.status(500);
								}
								const outQuery = await implementation.queryHandler(request.body);
								reply.code(200);
								reply.send({
									response: outQuery,
								});
								return;
							case 'mutation':
								if (!implementation.mutationHandler) {
									return reply.status(500);
								}
								const outMutation = await implementation.mutationHandler(request.body);
								reply.code(200);
								reply.send({
									response: outMutation,
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
