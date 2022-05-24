import { FastifyLoggerInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { GraphQLSchema } from 'graphql';
import {
	getGraphQLParameters,
	processRequest,
	renderGraphiQL,
	sendResult,
	shouldRenderGraphiQL,
	ExecutionContext as HelixExecutionContext,
} from 'graphql-helix';
import { Context } from '../server';
import { InternalClient } from '../internal-client';

export interface GraphQLServerConfig {
	serverName: string;
	schema: GraphQLSchema | Promise<GraphQLSchema>;
	apiNamespace?: string;
	enableGraphQLEndpoint?: boolean;
	routeUrl: string;
	// use baseContext to pass global data to the graphql context
	baseContext?: Object | Promise<Object>;
	// use the contextFactory to create a context for each request
	// the callback needs to be called with your object
	contextFactory?: (callback: (ctx: Object) => void) => Promise<void>;
	// by default, root fields will be prefixed with the api namespace
	// use skipRenameRootFields to skip this behaviour, e.g. if a field is already prefixed
	skipRenameRootFields?: string[];
	// implement resolverFactory to create a custom resolver
	customResolverFactory?: (executionContext: HelixExecutionContext & ExecutionContext) => Promise<{}>;
}

interface ExecutionContext {
	wunderGraphClient: InternalClient;
	requestContext: Context;
	log: FastifyLoggerInstance;
}

const FastifyGraphQLPlugin: FastifyPluginAsync<GraphQLServerConfig> = async (fastify, config) => {
	const schema = await config.schema;
	const baseContext = await config.baseContext;
	fastify.route({
		method: ['GET', 'POST'],
		url: config.routeUrl,
		async handler(req, res) {
			const request = {
				body: req.body,
				headers: req.headers,
				method: req.method,
				query: req.query,
			};

			if (config.enableGraphQLEndpoint && shouldRenderGraphiQL(request)) {
				res.type('text/html');
				res.send(
					renderGraphiQL({
						endpoint: config.routeUrl,
					})
				);
			} else {
				const request = {
					body: req.body,
					headers: req.headers,
					method: req.method,
					query: req.query,
				};
				const { operationName, query, variables } = getGraphQLParameters(request);

				if (config.contextFactory) {
					await config.contextFactory(async (ctx) => {
						const result = await processRequest<ExecutionContext>({
							operationName,
							query,
							variables,
							request,
							schema,
							// @ts-ignore
							rootValueFactory: config.customResolverFactory,
							contextFactory: (): ExecutionContext => ({
								...baseContext,
								...ctx,
								requestContext: req.ctx,
								wunderGraphClient: fastify.wunderGraphClient,
								log: req.log.child({ server: config.serverName, plugin: 'graphql' }),
							}),
						});

						await sendResult(result, res.raw);
						res.sent = true;
					});
					return;
				}

				const result = await processRequest<ExecutionContext>({
					operationName,
					query,
					variables,
					request,
					schema,
					// @ts-ignore
					rootValueFactory: config.customResolverFactory,
					contextFactory: (): ExecutionContext => ({
						...baseContext,
						requestContext: req.ctx,
						wunderGraphClient: fastify.wunderGraphClient,
						log: req.log.child({ server: config.serverName, plugin: 'graphql' }),
					}),
				});

				await sendResult(result, res.raw);

				// skip async/await handling because we already sent the result with the raw http socket
				res.sent = true;
			}
		},
	});
};

export default fp(FastifyGraphQLPlugin, '3.x');
