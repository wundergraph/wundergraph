import { FastifyPluginAsync } from 'fastify';
import path from 'path';
import process from 'node:process';
import { WebHook } from '../../webhooks/types';
import { objectToHeaders } from 'headers-polyfill';
import { WebhookConfiguration } from '@wundergraph/protobuf';

export interface WebHookRouteConfig {
	kind: 'webhook';
	webhookName?: string;
}

export interface FastifyWebHooksOptions {
	webhooks: WebhookConfiguration[];
}

const FastifyWebhooksPlugin: FastifyPluginAsync<FastifyWebHooksOptions> = async (fastify, config) => {
	for (const hook of config.webhooks) {
		try {
			const webhookFilePath = path.join(process.env.WG_ABS_DIR!, 'generated', 'bundle', hook.filePath);
			const webhook: WebHook = (await import(webhookFilePath)).default;

			fastify.route({
				url: `/webhooks/${hook.name}`,
				method: ['GET', 'POST'],
				config: { webhookName: hook.name, kind: 'webhook' },
				handler: async (request, reply) => {
					return webhook.handler(
						{
							url: request.url,
							headers: objectToHeaders(request.headers),
							query: request.query,
						},
						reply
					);
				},
			});
		} catch (err) {
			fastify.log.error(err, 'Could not load webhook function');
		}
	}
};

export default FastifyWebhooksPlugin;
