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
			const nodeJsOperation: NodeJSOperation<any, any> = (await import(operation.module_path)).default;
			const routeUrl = path.join('/functions', operation.operation_name);
			fastify.route({
				url: routeUrl,
				method: ['POST'],
				config: {},
				handler: async (request, reply) => {
					try {
						const out = await nodeJsOperation.handler(request.body);
						console.log('out', JSON.stringify(out));
						reply.code(200);
						reply.send({
							response: out,
						});
						return;
					} catch (e) {
						fastify.log.error(e);
						reply.code(500);
					}
				},
			});
			fastify.log.debug(`Function '${operation.operation_name}' registered at ${routeUrl}`);
		} catch (err) {
			fastify.log.error(err, 'Could not load function', operation.operation_name);
		}
	}
};

export default FastifyFunctionsPlugin;
