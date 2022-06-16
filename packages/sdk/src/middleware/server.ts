import { WunderGraphConfiguration } from '@wundergraph/protobuf';
import FastifyGraceful from 'fastify-graceful-shutdown';
import process from 'node:process';
import HooksPlugin from './plugins/hooks';
import GraphQLServerPlugin, { GraphQLServerConfig } from './plugins/graphql';
import Fastify, { FastifyLoggerInstance } from 'fastify';
import { HooksConfiguration } from '../configure';
import type { InternalClient } from './internal-client';
import { InternalClientFactory, internalClientFactory } from './internal-client';
import path from 'path';
import fs from 'fs';
import { middlewarePort } from '../env';

declare module 'fastify' {
	interface FastifyRequest extends RequestContext {}
}

export interface RequestContext<User = any, IC = InternalClient> {
	clientRequestHeaders: { [key: string]: string };
	ctx: Context<User, IC>;
}

export interface Context<User = any, IC = InternalClient> {
	user?: User;
	clientRequest: ClientRequest;
	setClientRequestHeader: (name: string, value: string) => void;
	log: FastifyLoggerInstance;
	internalClient: IC;
}

export interface ClientRequest {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';
	requestURI: string;
	headers: {
		[key: string]: string;
	};
}

export interface WunderGraphRequest {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';
	requestURI: string;
	headers: {
		[key: string]: string;
	};
	body: any;
}

export interface WunderGraphResponse extends WunderGraphRequest {
	status: string;
	statusCode: number;
}

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export interface User<Role = any> {
	provider?: string;
	provider_id?: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	first_name?: string;
	last_name?: string;
	nick_name?: string;
	description?: string;
	user_id?: string;
	avatar_url?: string;
	location?: string;
	roles?: Role[];
	custom_attributes?: string[];
	custom_claims?: {
		[key: string]: any;
	};
	access_token?: JSONObject;
	id_token?: JSONObject;
	raw_id_token?: string;
}

export interface WunderGraphServerConfig<GeneratedHooksConfig = HooksConfiguration> {
	hooks: GeneratedHooksConfig;
	graphqlServers?: Omit<GraphQLServerConfig, 'routeUrl'>[];
}

export interface WunderGraphHooksAndServerConfig<GeneratedHooksConfig = HooksConfiguration>
	extends WunderGraphServerConfig<GeneratedHooksConfig> {
	graphqlServers?: (GraphQLServerConfig & { url: string })[];
}

export const SERVER_PORT = middlewarePort;

process.on('uncaughtExceptionMonitor', (err, origin) => {
	console.error(`uncaught exception, origin: ${origin}, error: ${err}`);
});

const fastify = Fastify({
	logger: true,
});

let WG_CONFIG: WunderGraphConfiguration;
let clientFactory: InternalClientFactory;

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
			clientFactory = internalClientFactory(WG_CONFIG);
		} catch (err: any) {
			fastify.log.error('Could not parse wundergraph.config.json. Try `wunderctl generate`');
			process.exit(1);
		}
	} catch {
		fastify.log.error('Could not load wundergraph.config.json. Did you forget to run `wunderctl generate` ?');
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
		fastify.decorateRequest('ctx', null);
		fastify.decorateRequest('clientRequestHeaders', null);
		startServer(hooksConfig, WG_CONFIG).catch((err) => {
			fastify.log.error(err, 'Could not start the hook server');
			process.exit(1);
		});
	}

	return hooksConfig;
};

export const startServer = async (hooksConfig: WunderGraphHooksAndServerConfig, config: WunderGraphConfiguration) => {
	fastify.addHook<{ Body: { __wg?: { user: User; client_request: ClientRequest } } }>(
		'preHandler',
		async (req, reply) => {
			req.clientRequestHeaders = {};
			req.ctx = {
				log: req.log.child({ plugin: 'hooks' }),
				user: req?.body?.__wg?.user,
				// clientRequest represents usually the original client request that was sent to the server
				// but on internal requests, it is the request that was sent from the hook to the WunderGraph server
				clientRequest: req?.body?.__wg?.client_request || {
					headers: {},
					requestURI: '',
					method: 'GET',
				},
				setClientRequestHeader: (name: string, value: string) => (req.clientRequestHeaders[name] = value),
				internalClient: clientFactory({}, req?.body?.__wg?.client_request),
			};
		}
	);

	await fastify.register(FastifyGraceful);
	fastify.gracefulShutdown((signal, next) => {
		fastify.log.info('graceful shutdown', { signal });
		next();
	});
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

	return fastify.listen(SERVER_PORT, '127.0.0.1');
};
