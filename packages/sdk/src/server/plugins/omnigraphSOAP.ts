import { FastifyPluginAsync } from 'fastify';
import { GraphQLSchema } from 'graphql';
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

const fetchWithHeaders = (url: string, options?: RequestInit, context?: any, info?: GraphQLResolveInfo) => {
	const headers = {
		...context?.headers,
		...options?.headers,
	};

	return (fetch as MeshFetch)(url, { ...options, headers }, context, info);
};

const FastifySoapGraphQLPlugin: FastifyPluginAsync<SoapServerConfig> = async (fastify, config) => {
	const schema = executableSchema(config.schema);

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

			console.log('operationName', operationName, 'query', query, 'variables', variables);

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
					console.log('document', document, 'contextValue', contextValue, 'variableValues', variableValues);

					return executor({
						document: document,
						context: contextValue,
						variables: variableValues,
					});
				},
			});

			console.log('\n\n\n\n\n\n\n\n HAHAHAHA \n\n\n\n\n\n\n\n');
			console.log(result);

			await sendResult(result, reply.raw);
		},
	});
};

const executableSchema = (schemaStr: string): GraphQLSchema => {
	return buildSchema(schemaStr, {
		assumeValidSDL: true,
		assumeValid: true,
	});
};

export default FastifySoapGraphQLPlugin;
