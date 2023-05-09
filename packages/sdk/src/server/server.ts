import closeWithGrace from 'close-with-grace';
import { Headers } from '@whatwg-node/fetch';
import process from 'node:process';
import Fastify, { FastifyInstance } from 'fastify';
import { InternalClient, InternalClientFactory, internalClientFactory } from './internal-client';
import { pino } from 'pino';
import path from 'path';
import fs from 'fs';
import { resolveServerLogLevel, ServerLogger } from '../logger';
import { resolveConfigurationVariable } from '../configure/variables';
import { onParentProcessExit } from '../utils/process';
import { customGqlServerMountPath } from './util';

import type { WunderGraphConfiguration } from '@wundergraph/protobuf';
import { ConfigurationVariableKind, DataSourceKind } from '@wundergraph/protobuf';
import type { WebhooksConfig } from '../webhooks/types';
import type { HooksRouteConfig } from './plugins/hooks';
import type { WebHookRouteConfig } from './plugins/webhooks';
import type {
	FastifyRequestBody,
	HooksConfiguration,
	ServerRunOptions,
	WunderGraphHooksAndServerConfig,
	WunderGraphServerConfig,
} from './types';
import type { LoadOperationsOutput } from '../graphql/operations';
import FastifyFunctionsPlugin from './plugins/functions';
import { WgEnv } from '../configure/options';
import { OperationsClient } from './operations-client';
import { OpenApiServerConfig } from './plugins/omnigraphOAS';
import { SoapServerConfig } from './plugins/omnigraphSOAP';

let WG_CONFIG: WunderGraphConfiguration;
let clientFactory: InternalClientFactory;
let logger: pino.Logger;

/**
 * By default, this script will not start the server
 * You need to pass START_HOOKS_SERVER=true to start the server
 */
if (process.env.START_HOOKS_SERVER === 'true') {
	logger = ServerLogger;

	/**
	 * The 'uncaughtExceptionMonitor' event is emitted before an 'uncaughtException' event is emitted or
	 * a hook installed via process.setUncaughtExceptionCaptureCallback() is called. Installing an
	 * 'uncaughtExceptionMonitor' listener does not change the behavior once an 'uncaughtException'
	 * event is emitted. The process will still crash if no 'uncaughtException' listener is installed.
	 */
	process.on('uncaughtExceptionMonitor', (err, origin) => {
		logger.error(err, `uncaught exception, origin: ${origin}`);
	});

	if (!process.env.WG_DIR_ABS) {
		logger.fatal('The environment variable `WG_DIR_ABS` is required!');
		process.exit(1);
	}
	try {
		const configContent = fs.readFileSync(path.join(process.env.WG_DIR_ABS!, 'generated', 'wundergraph.config.json'), {
			encoding: 'utf8',
		});
		WG_CONFIG = JSON.parse(configContent);

		if (WG_CONFIG.api && WG_CONFIG.api?.nodeOptions?.nodeInternalUrl) {
			const nodeInternalURL = resolveConfigurationVariable(WG_CONFIG.api.nodeOptions.nodeInternalUrl);
			clientFactory = internalClientFactory(WG_CONFIG.api.operations, nodeInternalURL);
		} else {
			throw new Error('User defined api is not set.');
		}
	} catch (err: any) {
		logger.fatal(err, 'Could not load wundergraph.config.json. Did you forget to run `wunderctl generate` ?');
		process.exit(1);
	}
}

export function configureWunderGraphServer<
	GeneratedHooksConfig = HooksConfiguration,
	GeneratedInternalClient = InternalClient,
	GeneratedWebhooksConfig = WebhooksConfig,
	TRequestContext = any,
	TGlobalContext = any
>(
	configWrapper: () => WunderGraphServerConfig<
		GeneratedHooksConfig,
		GeneratedWebhooksConfig,
		TRequestContext,
		TGlobalContext
	>
) {
	return _configureWunderGraphServer<GeneratedHooksConfig, GeneratedWebhooksConfig, TRequestContext, TGlobalContext>(
		configWrapper()
	);
}

const _configureWunderGraphServer = <
	GeneratedHooksConfig = HooksConfiguration,
	GeneratedWebhooksConfig = WebhooksConfig,
	TRequestContext = any,
	TGlobalContext = any
>(
	config: WunderGraphServerConfig<GeneratedHooksConfig, GeneratedWebhooksConfig, TRequestContext, TGlobalContext>
): WunderGraphHooksAndServerConfig<GeneratedHooksConfig, GeneratedWebhooksConfig, TRequestContext, TGlobalContext> => {
	const serverConfig = config as WunderGraphHooksAndServerConfig<
		GeneratedHooksConfig,
		GeneratedWebhooksConfig,
		TRequestContext,
		TGlobalContext
	>;

	/**
	 * Configure the custom GraphQL servers
	 */
	if (serverConfig.graphqlServers && serverConfig.graphqlServers.length > 0) {
		let seenServer: { [key: string]: boolean } = {};
		serverConfig.graphqlServers.forEach((server) => {
			if (seenServer[server.serverName]) {
				throw new Error(`A server with the name '${server.serverName}' has been already registered!`);
			}
			server.routeUrl = customGqlServerMountPath(server.serverName);
			seenServer[server.serverName] = true;
		});
	}

	/**
	 * This environment variable is used to determine if the server should start the hooks server.
	 */
	if (process.env.START_HOOKS_SERVER === 'true') {
		const isProduction = process.env.NODE_ENV === 'production';

		if (!isProduction) {
			// Exit the server when wunderctl exited without the chance to kill the child processes
			onParentProcessExit(() => {
				process.exit(0);
			});
		}

		logger.info('Starting WunderGraph Server');

		startServer({
			wundergraphDir: process.env.WG_DIR_ABS!,
			config: WG_CONFIG,
			serverConfig,
			// only in production because it has no value in development
			gracefulShutdown: isProduction,
			clientFactory,
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
		logger.fatal('Could not start the hook server');
		process.exit(1);
	}
};

export const createServer = async ({
	wundergraphDir,
	serverConfig,
	config,
	gracefulShutdown,
	clientFactory,
}: ServerRunOptions): Promise<FastifyInstance> => {
	if (config.api?.serverOptions?.logger?.level && process.env.WG_DEBUG_MODE !== 'true') {
		logger.level = resolveServerLogLevel(config.api.serverOptions.logger.level);
	}

	const nodeInternalURL = config?.api?.nodeOptions?.nodeInternalUrl
		? resolveConfigurationVariable(config.api.nodeOptions.nodeInternalUrl)
		: '';

	let id = 0;
	const fastify = Fastify({
		logger,
		disableRequestLogging: true,
		genReqId: (req) => {
			if (req.headers['x-request-id']) {
				return req.headers['x-request-id']?.toString();
			}
			return `${++id}`;
		},
	});

	const globalContext = serverConfig.context?.global?.create ? await serverConfig.context.global.create() : undefined;

	/**
	 * Custom request logging to not log all requests with INFO level.
	 */

	fastify.addHook('onRequest', (req, reply, done) => {
		req.log.debug({ req }, 'received request');
		done();
	});

	fastify.addHook('onResponse', (req, reply, done) => {
		req.log.debug({ res: reply, url: req.raw.url, responseTime: reply.getResponseTime() }, 'request completed');
		done();
	});

	fastify.decorateRequest('ctx', null);

	fastify.route({
		method: 'GET',
		url: '/health',
		handler: function (request, reply) {
			reply.code(200).send({ status: 'ok' });
		},
	});

	const createContext = async (globalContext: any) => {
		if (serverConfig.context?.request?.create) {
			const result = await serverConfig.context.request.create(globalContext);
			if (result === undefined) {
				throw new Error('could not instantiate request context');
			}
			return result;
		}
		return undefined;
	};

	const releaseContext = async (requestContext: any) => {
		if (serverConfig.context?.request?.release) {
			await serverConfig.context.request.release(requestContext);
		}
	};

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
		fastify.addHook<{ Body: FastifyRequestBody }>('preHandler', async (req, reply) => {
			// clientRequest represents the original client request that was sent initially to the WunderNode.
			const clientRequest = {
				headers: new Headers(req.body.__wg.clientRequest?.headers),
				requestURI: req.body.__wg.clientRequest?.requestURI || '',
				method: req.body.__wg.clientRequest?.method || 'GET',
			};
			req.ctx = {
				log: req.log,
				user: req.body.__wg.user!,
				clientRequest,
				internalClient: clientFactory({ 'x-request-id': req.id }, req.body.__wg.clientRequest),
				operations: new OperationsClient({
					baseURL: nodeInternalURL,
					clientRequest: req.body.__wg.clientRequest,
					extraHeaders: {
						'x-request-id': req.id,
					},
				}),
				context: await createContext(globalContext),
			};
		});

		fastify.addHook<{ Body: FastifyRequestBody }>('onResponse', async (req) => {
			await releaseContext(req.ctx.context);
		});

		if (serverConfig?.hooks && Object.keys(serverConfig.hooks).length > 0) {
			await fastify.register(require('./plugins/hooks'), { ...serverConfig.hooks, config });
			fastify.log.debug('Hooks plugin registered');
		}

		let openApiServers: Set<OpenApiServerConfig> = new Set();
		let soapServers: Set<SoapServerConfig> = new Set();

		const serverUrlPlaceholderPrefix = WgEnv.ServerUrl + '-';

		config.api?.engineConfiguration?.datasourceConfigurations?.forEach((ds) => {
			// we could identify omnigraph proxy when url contains `WG_SERVER_URL-` prefix
			// example openapi server placeholder: `WG_SERVER_URL-openapi`
			// example soap server placeholder: `WG_SERVER_URL-soap`
			const isOmnigraph =
				ds.kind == DataSourceKind.GRAPHQL &&
				ds.customGraphql?.fetch?.url?.kind === ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE &&
				ds.customGraphql?.fetch?.url?.staticVariableContent.startsWith(serverUrlPlaceholderPrefix);
			if (!isOmnigraph) {
				return;
			}

			const schema = ds.customGraphql?.upstreamSchema;
			let serverName, mountPath;

			if (ds.customGraphql?.fetch?.path?.staticVariableContent) {
				mountPath = ds.customGraphql?.fetch?.path?.staticVariableContent;
				serverName = mountPath.split('/').pop()!;
			}

			switch (ds.customGraphql?.fetch?.url?.staticVariableContent.slice(serverUrlPlaceholderPrefix.length)) {
				case 'openapi':
					let upstreamURL;
					if (ds.customGraphql?.fetch?.baseUrl) {
						upstreamURL = resolveConfigurationVariable(ds.customGraphql?.fetch?.baseUrl);
					}

					openApiServers.add(<OpenApiServerConfig>{
						serverName,
						mountPath,
						upstreamURL,
						schema,
					});
					break;
				case 'soap':
					soapServers.add(<SoapServerConfig>{
						serverName,
						mountPath,
						schema,
					});
					break;
			}
		});

		// mount omnigraph open-api proxies
		if (openApiServers.size > 0) {
			const omnigraphPlugin = await require('./plugins/omnigraphOAS');

			for (const server of openApiServers) {
				await fastify.register(omnigraphPlugin, server);
				fastify.log.debug('OpenAPI plugin registered');
				fastify.log.info(`OpenAPI GraphQL server '${server.serverName}' listening at ${server.mountPath}`);
			}
		}

		// mount omnigraph soap proxies
		if (soapServers.size > 0) {
			const soapPlugin = await require('./plugins/omnigraphSOAP');

			for (const server of soapServers) {
				await fastify.register(soapPlugin, server);
				fastify.log.debug('SOAP plugin registered');
				fastify.log.info(`SOAP GraphQL server '${server.serverName}' listening at ${server.mountPath}`);
			}
		}

		const hasGraphqlServers = serverConfig.graphqlServers && serverConfig.graphqlServers.length > 0;

		if (hasGraphqlServers) {
			const graphqlPlugin = await require('./plugins/graphql');

			for await (const server of serverConfig.graphqlServers!) {
				const routeUrl = customGqlServerMountPath(server.serverName);
				await fastify.register(graphqlPlugin, { ...server, routeUrl: routeUrl });
				fastify.log.debug('GraphQL plugin registered');
				fastify.log.info(`GraphQL server '${server.serverName}' listening at ${routeUrl}`);
			}
		}
	});

	if (config.api?.webhooks && config.api.webhooks.length > 0) {
		await fastify.register(require('./plugins/webhooks'), {
			wundergraphDir,
			webhooks: config.api.webhooks,
			internalClientFactory: clientFactory,
			nodeURL: nodeInternalURL,
			globalContext,
			createContext,
			releaseContext,
		});
		fastify.log.debug('Webhooks plugin registered');
	}

	const operationsFilePath = path.join(wundergraphDir, 'generated', 'wundergraph.operations.json');
	const operationsFileExists = fs.existsSync(operationsFilePath);

	if (operationsFileExists) {
		const operationsConfigFile = fs.readFileSync(operationsFilePath, 'utf-8');
		const operationsConfig = JSON.parse(operationsConfigFile) as LoadOperationsOutput;

		const ormModulePath = path.join(wundergraphDir, 'generated', 'bundle', 'orm.cjs');
		const ormModule = await import(ormModulePath);

		if (
			operationsConfig &&
			operationsConfig.typescript_operation_files &&
			operationsConfig.typescript_operation_files.length
		) {
			await fastify.register(FastifyFunctionsPlugin, {
				operations: operationsConfig.typescript_operation_files,
				internalClientFactory: clientFactory,
				nodeURL: nodeInternalURL,
				globalContext,
				createContext,
				releaseContext,
				// @todo export an `ORM` class that we construct here (i.e so we can provide dependencies)
				orm: ormModule ? ormModule.orm : null,
			});
			fastify.log.debug('Functions plugin registered');
		}
	}

	if (gracefulShutdown) {
		const handler: closeWithGrace.CloseWithGraceAsyncCallback = async ({ manual, err, signal }) => {
			if (err) {
				fastify.log.error({ err, signal, manual }, 'error in graceful shutdown listeners');
			}
			fastify.log.debug({ err, signal, manual }, 'graceful shutdown was initiated manually');

			await fastify.close();
			fastify.log.info({ err, signal, manual }, 'server process shutdown');
		};
		// exit the process gracefully (if possible)
		// gracefully means we exit on signals and uncaught exceptions and the
		// server has 500ms to close all connections before the process is killed
		closeWithGrace({ delay: 500 }, handler);
	}

	fastify.addHook('onClose', async () => {
		if (serverConfig.context?.global?.release) {
			await serverConfig.context.global.release(globalContext);
		}
	});

	return fastify;
};
