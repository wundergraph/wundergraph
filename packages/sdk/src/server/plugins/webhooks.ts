import { FastifyPluginAsync } from 'fastify';
import path from 'path';
import type { ORM } from '@wundergraph/orm';

import { Webhook, WebhookHeaders, WebhookQuery } from '../../webhooks/types';
import { Headers } from '@whatwg-node/fetch';
import type { RequestMethod } from '../types';
import type { WebhookConfiguration } from '@wundergraph/protobuf';
import type { InternalClientFactory } from '../internal-client';
import process from 'node:process';
import { OperationsClient } from '../operations-client';
import { propagation, trace } from '@opentelemetry/api';

export interface WebHookRouteConfig {
	kind: 'webhook';
	webhookName?: string;
}

interface FastifyWebHooksOptions {
	webhooks: WebhookConfiguration[];
	internalClientFactory: InternalClientFactory;
	orm: ORM<any>;
	nodeURL: string;
	globalContext: any;
	createContext: (globalContext: any) => Promise<any>;
	releaseContext: (requestContext: any) => Promise<void>;
}

const FastifyWebhooksPlugin: FastifyPluginAsync<FastifyWebHooksOptions> = async (fastify, config) => {
	await fastify.register(require('@fastify/formbody'));
	for (const hook of config.webhooks) {
		try {
			const webhookFilePath = path.join(process.env.WG_DIR_ABS!, 'generated', 'bundle', hook.filePath);
			const webhook: Webhook<any, any, any, any, any> = (await import(webhookFilePath)).default;

			fastify.route({
				url: `/webhooks/${hook.name}`,
				method: ['GET', 'POST'],
				config: { webhookName: hook.name, kind: 'webhook' },
				handler: async (req, reply) => {
					let requestContext;
					try {
						const headers: { [key: string]: string } = {
							'x-request-id': req.id,
						};
						if (req.telemetry) {
							propagation.inject(req.telemetry.context, headers);
						}

						requestContext = await config.createContext(config.globalContext);
						const clientRequest = {
							headers: new Headers(req.headers as Record<string, string>),
							method: req.method as RequestMethod,
							requestURI: req.url,
						};
						const operationClient = new OperationsClient({
							baseURL: config.nodeURL,
							clientRequest,
							extraHeaders: headers,
							tracer: fastify.tracer,
							traceContext: req.telemetry?.context,
						});
						const eventResponse = await webhook.handler(
							{
								method: req.method as RequestMethod,
								url: req.url,
								body: req.body,
								headers: (req.headers as WebhookHeaders) || {},
								query: (req.query as WebhookQuery) || {},
							},
							{
								log: req.log.child({ webhook: hook.name }),
								internalClient: config.internalClientFactory(headers, clientRequest),
								operations: operationClient,
								clientRequest,
								graph: config.orm,
								context: requestContext,
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
						req.log.child({ webhook: hook.name }).error(e, 'Webhook handler threw an error');
						reply.code(500);
					} finally {
						await config.releaseContext(requestContext);
					}
				},
			});
		} catch (err) {
			fastify.log.child({ webhook: hook.name }).error(err, 'Could not load webhook function');
		}
	}

	fastify.addHook('onRequest', async (req, resp) => {
		if (req.telemetry) {
			const routeConfig = req.routeConfig as WebHookRouteConfig | undefined;
			const span = trace.getSpan(req.telemetry.context);
			if (span && routeConfig?.kind === 'webhook') {
				span.setAttributes({
					'wg.webhook.name': routeConfig.webhookName,
				});
			}
		}
	});
};

export default FastifyWebhooksPlugin;
