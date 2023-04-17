import { FastifyPluginAsync } from 'fastify';
import path from 'path';
import { Webhook, WebhookHeaders, WebhookQuery } from '../../webhooks/types';
import { Headers } from '@web-std/fetch';
import type { RequestMethod } from '../types';
import type { WebhookConfiguration } from '@wundergraph/protobuf';
import type { InternalClientFactory } from '../internal-client';
import process from 'node:process';
import { OperationsClient } from '../operations-client';

export interface WebHookRouteConfig {
	kind: 'webhook';
	webhookName?: string;
}

interface FastifyWebHooksOptions {
	webhooks: WebhookConfiguration[];
	internalClientFactory: InternalClientFactory;
	nodeURL: string;
}

const FastifyWebhooksPlugin: FastifyPluginAsync<FastifyWebHooksOptions> = async (fastify, config) => {
	await fastify.register(require('@fastify/formbody'));

	for (const hook of config.webhooks) {
		try {
			const webhookFilePath = path.join(process.env.WG_DIR_ABS!, 'generated', 'bundle', hook.filePath);
			const webhook: Webhook = (await import(webhookFilePath)).default;

			fastify.route({
				url: `/webhooks/${hook.name}`,
				method: ['GET', 'POST'],
				config: { webhookName: hook.name, kind: 'webhook' },
				handler: async (request, reply) => {
					try {
						const operationClient = new OperationsClient({
							baseURL: config.nodeURL,
							clientRequest: null,
						});
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
										headers: new Headers(request.headers as Record<string, string>),
										method: request.method as RequestMethod,
										requestURI: request.url,
									}
								),
								operations: operationClient,
							}
						);

						if (eventResponse.headers) {
							reply.headers(eventResponse.headers);
						}
						if (eventResponse.body) {
							reply.send(eventResponse.body);
						}
						reply.code(eventResponse.statusCode || 200);
					} catch (e) {
						request.log.child({ webhook: hook.name }).error(e, 'Webhook handler threw an error');
						reply.code(500);
					}
				},
			});
		} catch (err) {
			fastify.log.child({ webhook: hook.name }).error(err, 'Could not load webhook function');
		}
	}
};

export default FastifyWebhooksPlugin;
