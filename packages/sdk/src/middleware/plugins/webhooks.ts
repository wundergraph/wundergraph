import { FastifyPluginAsync } from 'fastify';
import path from 'path';
import process from 'node:process';
import { Webhook, WebhookHeaders, WebhookQuery } from '../../webhooks/types';
import { objectToHeaders } from 'headers-polyfill';
import { WebhookConfiguration } from '@wundergraph/protobuf';
import { InternalClientFactory } from '../internal-client';
import { RequestMethod } from '../server';

export interface WebHookRouteConfig {
	kind: 'webhook';
	webhookName?: string;
}

export interface FastifyWebHooksOptions {
	webhooks: WebhookConfiguration[];
	internalClientFactory: InternalClientFactory;
}

const FastifyWebhooksPlugin: FastifyPluginAsync<FastifyWebHooksOptions> = async (fastify, config) => {
	await fastify.register(require('@fastify/formbody'));

	for (const hook of config.webhooks) {
		try {
			const webhookFilePath = path.join(process.env.WG_ABS_DIR!, 'generated', 'bundle', hook.filePath);
			const webhook: Webhook = (await import(webhookFilePath)).default;

			fastify.route({
				url: `/webhooks/${hook.name}`,
				method: ['GET', 'POST'],
				config: { webhookName: hook.name, kind: 'webhook' },
				handler: async (request, reply) => {
					const eventResponse = await webhook.handler(
						{
							method: request.method as RequestMethod,
							url: request.url,
							body: request.body,
							headers: (request.headers as WebhookHeaders) || {},
							query: (request.query as WebhookQuery) || {},
						},
						{
							log: request.log.child({ webhook: hook.name }),
							internalClient: config.internalClientFactory(
								{},
								{
									headers: objectToHeaders(request.headers),
									method: request.method as RequestMethod,
									requestURI: request.url,
								}
							),
						}
					);

					if (eventResponse.headers) {
						reply.headers(eventResponse.headers);
					}
					if (eventResponse.body) {
						reply.send(eventResponse.body);
					}
					reply.code(eventResponse.statusCode || 200);
				},
			});
		} catch (err) {
			fastify.log.error(err, 'Could not load webhook function');
		}
	}
};

export default FastifyWebhooksPlugin;
