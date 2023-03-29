import { FastifyBaseLogger, FastifyPluginAsync } from 'fastify';
import { execute, GraphQLSchema, parse } from 'graphql';
import { getGraphQLParameters, processRequest, sendResult } from 'graphql-helix';
import { pino } from 'pino';
import { buildSchema } from 'graphql/index';
import { DefaultLogger, PubSub } from '@graphql-mesh/utils';
import { LazyLoggerMessage, MeshPubSub } from '@graphql-mesh/types';
import { processDirectives } from '@omnigraph/openapi';
import { fetch } from '@whatwg-node/fetch';

export interface OpenApiServerConfig {
	serverName: string;
	schema: string;
	mountPath: string;
	baseURL?: string;
}

const FastifyGraphQLPlugin: FastifyPluginAsync<OpenApiServerConfig> = async (fastify, config) => {
	// console.log('serverName:', config.serverName, 'mountPath:', config.mountPath, 'baseURL:', config.baseURL);

	const schema = executableSchema(config.schema, fastify.log, config.baseURL);

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

			// console.log('request:', request);

			reply.hijack();

			const { operationName, query, variables } = getGraphQLParameters(request);

			// const document = parse(query!);

			// const result = await execute({
			// 	schema,
			// 	document,
			// 	operationName,
			// 	contextValue: {
			// 		headers: {
			// 			Authorization: 'Bearer sk_test_123',
			// 		},
			// 	},
			// });

			const result = await processRequest({
				operationName,
				query,
				variables,
				request,
				schema,
				contextFactory: () => ({
					headers: req.headers,
					// headers: {
					// 	Authorization: 'Bearer sk_test_123',
					// },
				}),
			});

			await sendResult(result, reply.raw);

			// console.log('execute result:', result);
			// reply.send(result);
		},
	});
};

const executableSchema = (schemaStr: string, logger: FastifyBaseLogger, baseURL: string | undefined): GraphQLSchema => {
	const schema = buildSchema(schemaStr, {
		assumeValidSDL: true,
		assumeValid: true,
	});
	const pubsub = new PubSub() as MeshPubSub;

	const logWrapper = new LoggerWrapper(logger);

	// const deflogger = new DefaultLogger('getComposerFromJSONSchema - test');

	process.env.DEBUG = 'true';

	return processDirectives({
		schema,
		// logger: deflogger,
		logger: logWrapper,
		pubsub,
		globalFetch: fetch,
		endpoint: baseURL != '' ? baseURL : undefined,
	});
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
		console.log(lazyArgs);
	}
	public child(name: string) {
		return this;
	}
}

export default FastifyGraphQLPlugin;
