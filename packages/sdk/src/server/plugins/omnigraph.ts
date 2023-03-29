import { FastifyBaseLogger, FastifyPluginAsync } from 'fastify';
import { execute, GraphQLSchema, parse } from 'graphql';
import { getGraphQLParameters, processRequest, sendResult } from 'graphql-helix';
import { pino } from 'pino';
import { buildSchema } from 'graphql/index';
import { DefaultLogger, PubSub } from '@graphql-mesh/utils';
import { LazyLoggerMessage, Logger, MeshFetch, MeshPubSub } from '@graphql-mesh/types';
import { processDirectives } from '@omnigraph/openapi';
import { fetch } from '@whatwg-node/fetch';

export interface OpenApiServerConfig {
	serverName: string;
	schema: string;
	mountPath: string;
	upstreamURL?: string;
}

const FastifyGraphQLPlugin: FastifyPluginAsync<OpenApiServerConfig> = async (fastify, config) => {
	if (process.env.WG_DEBUG_MODE === 'true') {
		// enable debugging queries in mesh omnigraph
		process.env.DEBUG = 'true';
	}

	const schema = executableSchema(config.schema, fastify.log, config.upstreamURL);

	fastify.route({
		method: ['GET', 'POST'],
		url: config.mountPath,
		async handler(req, reply) {
			const request = {
				body: req.body,
				headers: req.headers,
				method: req.method,
				query: req.query,
			};

			reply.hijack();

			const { operationName, query, variables } = getGraphQLParameters(request);

			const result = await processRequest({
				operationName,
				query,
				variables,
				request,
				schema,
				contextFactory: () => ({
					headers: req.headers,
				}),
			});

			await sendResult(result, reply.raw);
		},
	});
};

const executableSchema = (
	schemaStr: string,
	logger: FastifyBaseLogger,
	upstreamURL: string | undefined
): GraphQLSchema => {
	const schema = buildSchema(schemaStr, {
		assumeValidSDL: true,
		assumeValid: true,
	});
	const pubsub = new PubSub() as MeshPubSub;

	const logWrapper = new LoggerWrapper(logger);

	let opts: ProcessDirectiveArgs = {
		schema,
		logger: logWrapper,
		pubsub,
		globalFetch: fetch,
	};
	if (upstreamURL !== '') {
		opts['endpoint'] = upstreamURL;
	}

	return processDirectives(opts);
};

class LoggerWrapper {
	constructor(private logger: FastifyBaseLogger) {
		this.logger = logger;
	}

	public log(...args: any[]) {
		this.logger.info(args);
	}
	public warn(...args: any[]) {
		this.logger.warn(args);
	}
	public info(...args: any[]) {
		this.logger.info(args);
	}
	public error(...args: any[]) {
		this.logger.error(args);
	}
	public debug(...lazyArgs: LazyLoggerMessage[]) {
		// not sure what happens with lazy messages
	}
	public child(name: string) {
		return this;
	}
}

interface ProcessDirectiveArgs {
	schema: GraphQLSchema;
	pubsub: MeshPubSub;
	logger: Logger;
	globalFetch: MeshFetch;
	endpoint?: string;
	operationHeaders?: Record<string, string>;
	queryParams?: Record<string, any>;
}

export default FastifyGraphQLPlugin;
