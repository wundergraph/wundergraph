import { WunderGraphConfiguration } from '@wundergraph/protobuf';
import FastifyGraceful from 'fastify-graceful-shutdown';
import { Headers } from 'headers-polyfill';
import process from 'node:process';
import HooksPlugin, { HooksRouteConfig } from './plugins/hooks';
import FastifyWebhooksPlugin, { WebHookRouteConfig } from './plugins/webhooks';
import GraphQLServerPlugin from './plugins/graphql';
import Fastify, { FastifyInstance } from 'fastify';
import { HooksConfiguration } from '../configure';
import type { InternalClient } from './internal-client';
import { InternalClientFactory, internalClientFactory } from './internal-client';
import path from 'path';
import fs from 'fs';
import {
	ClientRequest,
	SERVER_PORT,
	WunderGraphHooksAndServerConfig,
	WunderGraphServerConfig,
	WunderGraphUser,
	ServerOptions,
} from './types';

/**
 * The 'uncaughtExceptionMonitor' event is emitted before an 'uncaughtException' event is emitted or
 * a hook installed via process.setUncaughtExceptionCaptureCallback() is called. Installing an
 * 'uncaughtExceptionMonitor' listener does not change the behavior once an 'uncaughtException'
 * event is emitted. The process will still crash if no 'uncaughtException' listener is installed.
 */
process.on('uncaughtExceptionMonitor', (err, origin) => {
	console.error(`uncaught exception, origin: ${origin}, error: ${err}`);
});

let WG_CONFIG: WunderGraphConfiguration;
let clientFactory: InternalClientFactory;

/**
 * By default this script will not start the server
 * You need to pass START_HOOKS_SERVER=true to start the server
 */
if (process.env.START_HOOKS_SERVER === 'true') {
	if (!process.env.WG_ABS_DIR) {
		console.error('The environment variable `WG_ABS_DIR` is required!');
		process.exit(1);
	}
	try {
		const configContent = fs.readFileSync(path.join(process.env.WG_ABS_DIR, 'generated', 'wundergraph.config.json'), {
			encoding: 'utf8',
		});
		try {
			WG_CONFIG = JSON.parse(configContent);
			if (WG_CONFIG.api) {
				clientFactory = internalClientFactory(WG_CONFIG.apiName, WG_CONFIG.deploymentName, WG_CONFIG.api.operations);
			} else {
				console.error('Could not get user defined api. Try `wunderctl generate`');
				process.exit(1);
			}
		} catch (err: any) {
			console.error('Could not parse wundergraph.config.json. Try `wunderctl generate`');
			process.exit(1);
		}
	} catch {
		console.error('Could not load wundergraph.config.json. Did you forget to run `wunderctl generate` ?');
		process.exit(1);
	}
}

export const configureWunderGraphServer = <
	GeneratedHooksConfig extends HooksConfiguration,
	GeneratedClient extends InternalClient
>(
	configWrapper: () => WunderGraphServerConfig<GeneratedHooksConfig>
): WunderGraphHooksAndServerConfig => {
	return _configureWunderGraphServer(configWrapper());
};

const _configureWunderGraphServer = <GeneratedHooksConfig extends HooksConfiguration>(
	config: WunderGraphServerConfig<GeneratedHooksConfig>
): WunderGraphHooksAndServerConfig => {
	const hooksConfig = config as WunderGraphHooksAndServerConfig;

	/**
	 * Configure the custom GraphQL servers
	 */
	if (hooksConfig.graphqlServers) {
		let seenServer: { [key: string]: boolean } = {};
		hooksConfig.graphqlServers.forEach((server) => {
			if (seenServer[server.serverName]) {
				throw new Error(`A server with the name '${server.serverName}' has been already registered!`);
			}
			seenServer[server.serverName] = true;
		});
		for (const server of hooksConfig.graphqlServers) {
			server.url = `http://127.0.0.1:${SERVER_PORT}/gqls/${server.serverName}/graphql`;
		}
	}

	/**
	 * This environment variable is used to determine if the server should start the hooks server.
	 */
	if (process.env.START_HOOKS_SERVER === 'true') {
		startServer({
			wundergraphDir: process.env.WG_ABS_DIR!,
			config: WG_CONFIG,
			hooksConfig,
			gracefulShutdown: process.env.NODE_ENV === 'production',
			host: '127.0.0.1',
			port: SERVER_PORT,
		}).catch((err) => {
			console.error('Could not start the hook server', err);
			process.exit(1);
		});
	}

	return hooksConfig;
};

export const startServer = async (opts: ServerOptions) => {
	const fastify = await createServer(opts);
	await fastify.listen({
		port: opts.port,
		host: opts.host,
	});
};

export const createServer = async ({
	wundergraphDir,
	hooksConfig,
	config,
	gracefulShutdown,
}: ServerOptions): Promise<FastifyInstance> => {
	const fastify = Fastify({
		logger: {
			level: process.env.LOG_LEVEL || 'info',
		},
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
					// clientRequest represents the original client request that was sent initially to the server.
					clientRequest: {
						headers: new Headers(req.body.__wg.clientRequest?.headers),
						requestURI: req.body.__wg.clientRequest?.requestURI || '',
						method: req.body.__wg.clientRequest?.method || 'GET',
					},
					internalClient: clientFactory({}, req.body.__wg.clientRequest),
				};
			}
		);

		await fastify.register(HooksPlugin, { ...hooksConfig.hooks, config });
		fastify.log.info('Hooks plugin registered');

		if (hooksConfig.graphqlServers) {
			for await (const server of hooksConfig.graphqlServers) {
				const routeUrl = `/gqls/${server.serverName}/graphql`;
				await fastify.register(GraphQLServerPlugin, { ...server, routeUrl: routeUrl });
				fastify.log.info('GraphQL plugin registered');
				fastify.log.info(`Graphql server '${server.serverName}' listening at ${server.url}`);
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
