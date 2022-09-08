import { logLevelToJSON, WunderGraphConfiguration } from '@wundergraph/protobuf';
import FastifyGraceful from 'fastify-graceful-shutdown';
import { Headers } from '@web-std/fetch';
import process from 'node:process';
import HooksPlugin, { HooksRouteConfig } from './plugins/hooks';
import FastifyWebhooksPlugin, { WebHookRouteConfig } from './plugins/webhooks';
import GraphQLServerPlugin from './plugins/graphql';
import Fastify, { FastifyInstance } from 'fastify';
import { customGqlServerMountPath, HooksConfiguration } from '../configure';
import type { InternalClient } from './internal-client';
import Pino, { pino } from 'pino';
import { InternalClientFactory, internalClientFactory } from './internal-client';
import path from 'path';
import fs from 'fs';
import {
	ClientRequest,
	WunderGraphServerConfig,
	WunderGraphUser,
	ServerRunOptions,
	WunderGraphHooksAndServerConfig,
} from './types';
import { WebhooksConfig } from '../webhooks/types';
import { PinoLogLevel, resolveServerLogLevel } from './logger';
import { resolveConfigurationVariable } from '../configure/variables';

let WG_CONFIG: WunderGraphConfiguration;
let clientFactory: InternalClientFactory;
let logger: pino.Logger;

/**
 * By default, this script will not start the server
 * You need to pass START_HOOKS_SERVER=true to start the server
 */
if (process.env.START_HOOKS_SERVER === 'true') {
	logger = Pino({
		level: process.env.LOG_LEVEL || PinoLogLevel.Info,
	});

	/**
	 * The 'uncaughtExceptionMonitor' event is emitted before an 'uncaughtException' event is emitted or
	 * a hook installed via process.setUncaughtExceptionCaptureCallback() is called. Installing an
	 * 'uncaughtExceptionMonitor' listener does not change the behavior once an 'uncaughtException'
	 * event is emitted. The process will still crash if no 'uncaughtException' listener is installed.
	 */
	process.on('uncaughtExceptionMonitor', (err, origin) => {
		logger.error(err, `uncaught exception, origin: ${origin}`);
	});

	if (!process.env.WG_ABS_DIR) {
		logger.fatal('The environment variable `WG_ABS_DIR` is required!');
		process.exit(1);
	}
	try {
		const configContent = fs.readFileSync(path.join(process.env.WG_ABS_DIR!, 'generated', 'wundergraph.config.json'), {
			encoding: 'utf8',
		});
		WG_CONFIG = JSON.parse(configContent);

		if (WG_CONFIG.api && WG_CONFIG.api?.nodeOptions?.nodeUrl) {
			const nodeUrl = resolveConfigurationVariable(WG_CONFIG.api.nodeOptions.nodeUrl);

			clientFactory = internalClientFactory(
				WG_CONFIG.apiName,
				WG_CONFIG.deploymentName,
				WG_CONFIG.api.operations,
				nodeUrl
			);
		} else {
			throw new Error('User defined api is not set.');
		}
	} catch (err: any) {
		logger.fatal(err, 'Could not load wundergraph.config.json. Did you forget to run `wunderctl generate` ?');
		process.exit(1);
	}
}

export const configureWunderGraphServer = <
	GeneratedHooksConfig extends HooksConfiguration,
	GeneratedClient extends InternalClient,
	GeneratedWebhooksConfig extends WebhooksConfig = WebhooksConfig
>(
	configWrapper: () => WunderGraphServerConfig<GeneratedHooksConfig, GeneratedWebhooksConfig>
): WunderGraphHooksAndServerConfig => {
	return _configureWunderGraphServer<GeneratedHooksConfig, GeneratedWebhooksConfig>(configWrapper());
};

const _configureWunderGraphServer = <
	GeneratedHooksConfig extends HooksConfiguration,
	GeneratedWebhooksConfig extends WebhooksConfig
>(
	config: WunderGraphServerConfig<GeneratedHooksConfig, GeneratedWebhooksConfig>
): WunderGraphHooksAndServerConfig => {
	const serverConfig = config as WunderGraphHooksAndServerConfig<GeneratedHooksConfig, GeneratedWebhooksConfig>;

	/**
	 * Configure the custom GraphQL servers
	 */
	if (serverConfig.graphqlServers) {
		let seenServer: { [key: string]: boolean } = {};
		serverConfig.graphqlServers.forEach((server) => {
			if (seenServer[server.serverName]) {
				throw new Error(`A server with the name '${server.serverName}' has been already registered!`);
			}
			seenServer[server.serverName] = true;
		});
	}

	/**
	 * This environment variable is used to determine if the server should start the hooks server.
	 */
	if (process.env.START_HOOKS_SERVER === 'true') {
		startServer({
			wundergraphDir: process.env.WG_ABS_DIR!,
			config: WG_CONFIG,
			serverConfig,
			gracefulShutdown: process.env.NODE_ENV === 'production',
		}).catch((err) => {
			logger.fatal(err, 'Could not start the hook server');
			process.exit(1);
		});
	}

	return serverConfig;
};

export const startServer = async (opts: ServerRunOptions) => {
	if (opts.config.api?.serverOptions?.listen?.port && !!opts.config.api?.serverOptions?.listen?.host) {
		const portString = resolveConfigurationVariable(opts.config.api.serverOptions.listen.port);
		const host = resolveConfigurationVariable(opts.config.api.serverOptions.listen.host);
		const port = parseInt(portString, 10);

		const fastify = await createServer(opts);
		await fastify.listen({
			port: port,
			host: host,
		});
	} else {
		console.error('Could not get user defined api. Try `wunderctl generate`');
		process.exit(1);
	}
};

export const createServer = async ({
	wundergraphDir,
	serverConfig,
	config,
	gracefulShutdown,
}: ServerRunOptions): Promise<FastifyInstance> => {
	if (config.api?.serverOptions?.logger?.level) {
		logger.level = resolveServerLogLevel(config.api.serverOptions.logger.level);
	}

	const fastify = Fastify({
		logger,
	});

	fastify.decorateRequest('ctx', null);

	/**
	 * Calls per event registration. We use it for debugging only.
	 */
	fastify.addHook('onRoute', (routeOptions) => {
		const routeConfig = routeOptions.config as HooksRouteConfig | WebHookRouteConfig | undefined;
		if (routeConfig?.kind === 'hook') {
			if (routeConfig.operationName) {
				fastify.log.debug(
					`Registered Operation Hook '${routeConfig.operationName}' with (${routeOptions.method}) '${routeOptions.url}'`
				);
			} else {
				fastify.log.debug(`Registered Global Hook (${routeOptions.method}) '${routeOptions.url}'`);
			}
		} else if (routeConfig?.kind === 'webhook') {
			fastify.log.debug(
				`Registered Webhook '${routeConfig.webhookName}' with (${routeOptions.method}) '${routeOptions.url}'`
			);
		}
	});

	/**
	 * We encapsulate the preHandler with a fastify plugin "register" to not apply it on other routes.
	 */
	await fastify.register(async (fastify) => {
		/**
		 * Calls on every request. We use it to do pre-init stuff e.g. create the request context and internalClient
		 * Registering this handler will only affect child plugins
		 */
		fastify.addHook<{ Body: { __wg: { user?: WunderGraphUser; clientRequest?: ClientRequest } } }>(
			'preHandler',
			async (req, reply) => {
				req.ctx = {
					log: req.log,
					user: req.body.__wg.user,
					// clientRequest represents the original client request that was sent initially to the WunderNode.
					clientRequest: {
						headers: new Headers(req.body.__wg.clientRequest?.headers),
						requestURI: req.body.__wg.clientRequest?.requestURI || '',
						method: req.body.__wg.clientRequest?.method || 'GET',
					},
					internalClient: clientFactory({}, req.body.__wg.clientRequest),
				};
			}
		);

		if (serverConfig?.hooks) {
			await fastify.register(HooksPlugin, { ...serverConfig.hooks, config });
			fastify.log.info('Hooks plugin registered');
		}

		if (serverConfig.graphqlServers) {
			for await (const server of serverConfig.graphqlServers) {
				const routeUrl = customGqlServerMountPath(server.serverName);
				await fastify.register(GraphQLServerPlugin, { ...server, routeUrl: routeUrl });
				fastify.log.info('GraphQL plugin registered');
				fastify.log.info(`Graphql server '${server.serverName}' listening at ${routeUrl}`);
			}
		}
	});

	if (config.api) {
		await fastify.register(FastifyWebhooksPlugin, {
			wundergraphDir,
			webhooks: config.api.webhooks,
			internalClientFactory: clientFactory,
		});
		fastify.log.info('Webhooks plugin registered');
	}

	// only in production because it slows down watch process in development
	if (gracefulShutdown) {
		await fastify.register(FastifyGraceful);
		fastify.gracefulShutdown((signal, next) => {
			fastify.log.info('graceful shutdown', { signal });
			next();
		});
	}

	return fastify;
};
