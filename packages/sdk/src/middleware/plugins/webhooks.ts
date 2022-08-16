import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { getWebhooks } from '../../webhooks';
import path from 'path';
import process from 'node:process';
import { WebHook } from '../../webhooks/types';
import { RouteGenericInterface } from 'fastify/types/route';

export interface WebHookRouteConfig {
	kind: 'webhook';
	webhookName?: string;
}

export interface FastifyWebHooksOptions {}

const FastifyWebhooksPlugin: FastifyPluginAsync<FastifyWebHooksOptions> = async (fastify, config) => {
	const webhooksBundleDir = path.join(process.env.WG_ABS_DIR!, 'generated', 'bundle', 'webhooks');
	const hooks = await getWebhooks(webhooksBundleDir, '.js');

	for (const hook of hooks) {
		try {
			const webhook: WebHook = (await import(hook.filePath)).default;

			fastify.route<RouteGenericInterface, WebHookRouteConfig>({
				url: `/webhooks/${hook.name}`,
				method: ['GET', 'POST'],
				config: { webhookName: hook.name, kind: 'webhook' },
				handler: async (request, reply) => {
					await webhook.handler();
					reply.code(200);
				},
			});
		} catch (err) {
			fastify.log.error(err, 'Could not load webhook function');
		}
	}
};

export default fp(FastifyWebhooksPlugin, '4.x');
