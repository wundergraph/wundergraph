import { FastifyPluginAsync } from 'fastify';
import { getGraphQLParameters, processRequest, sendResult } from 'graphql-helix';
import { buildSchema, GraphQLResolveInfo } from 'graphql/index';
import { fetch } from '@whatwg-node/fetch';
import { createExecutorFromSchemaAST } from '@omnigraph/soap';
import { MeshFetch } from '@graphql-mesh/types';

export interface SoapServerConfig {
	serverName: string;
	schema: string;
	mountPath: string;
}

// fetchWithHeaders - wraps fetch function to pass headers from context to fetch options
const fetchWithHeaders = (url: string, options?: RequestInit, context?: any, info?: GraphQLResolveInfo) => {
	/*
	 * temporary workaround to pass headers to fetch
	 * current drawback is that it will pass all headers from the wundernode request to the wundergraph server
	 * */

	const headers = {
		...context?.headers,
		...options?.headers,
	};

	return (fetch as MeshFetch)(url, { ...options, headers }, context, info);
};

const FastifySoapGraphQLPlugin: FastifyPluginAsync<SoapServerConfig> = async (fastify, config) => {
	const schema = buildSchema(config.schema, {
		assumeValidSDL: true,
		assumeValid: true,
	});

	// prepare queries executor from schema with soap directives
	const executor = createExecutorFromSchemaAST(schema, fetchWithHeaders);

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

				execute: ({ document, contextValue, variableValues }) => {
					return executor({
						document: document,
						context: contextValue,
						variables: variableValues,
					});
				},
			});

			await sendResult(result, reply.raw);
		},
	});
};

export default FastifySoapGraphQLPlugin;
