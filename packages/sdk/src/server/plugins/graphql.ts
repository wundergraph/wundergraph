import { FastifyPluginAsync } from 'fastify';
import { GraphQLSchema } from 'graphql';
import {
	getGraphQLParameters,
	processRequest,
	renderGraphiQL,
	sendResult,
	shouldRenderGraphiQL,
	ExecutionContext as HelixExecutionContext,
} from 'graphql-helix';
import type { BaseRequestContext } from '../types';

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
	wundergraph: BaseRequestContext;
}

const FastifyGraphQLPlugin: FastifyPluginAsync<GraphQLServerConfig> = async (fastify, config) => {
	const schema = await config.schema;
	const baseContext = await config.baseContext;

	fastify.route({
		method: ['GET', 'POST'],
		url: config.routeUrl,
		async handler(req, reply) {
			const request = {
				body: req.body,
				headers: req.headers,
				method: req.method,
				query: req.query,
			};

			const pluginLogger = req.ctx.log.withFields({ server: config.serverName, plugin: 'graphql' });

			if (config.enableGraphQLEndpoint && shouldRenderGraphiQL(request)) {
				reply.type('text/html');
				reply.send(
					renderGraphiQL({
						endpoint: config.routeUrl,
					})
				);
			} else {
				// https://www.fastify.io/docs/latest/Reference/Reply/#hijack
				// We hand over the response handling to "graphql-helix"
				// No fastify hooks are called for the response.
				reply.hijack();

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
								wundergraph: {
									...req.ctx,
									log: pluginLogger,
								},
							}),
						});

						await sendResult(result, reply.raw);
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
						wundergraph: {
							...req.ctx,
							log: pluginLogger,
						},
					}),
				});

				await sendResult(result, reply.raw);
			}
		},
	});
};

export default FastifyGraphQLPlugin;
